const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Make sure to add this to your .env file
});

/**
 * Analyzes a search query and generates relevance scores for VAs
 * @param {string} searchQuery - The natural language search query
 * @param {Array} vas - Array of VA objects to score
 * @returns {Array} - VAs with AI-generated relevance scores
 */
async function analyzeSearchQuery(searchQuery, vas) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, falling back to basic search');
      return vas.map(va => ({ ...va, aiScore: 0 }));
    }

    // Create a structured prompt for the AI to analyze the search query
    const prompt = `
You are an expert recruitment assistant. Analyze this search query and help match it to virtual assistants.

Search Query: "${searchQuery}"

Please identify:
1. Key skills or expertise being sought
2. Industry or domain requirements
3. Experience level preferences
4. Work type preferences (contract, full-time, etc.)
5. Any specific tools or technologies mentioned
6. Personality or soft skill requirements

Return your analysis in this JSON format:
{
  "skills": ["skill1", "skill2"],
  "industries": ["industry1"],
  "experienceLevel": "junior|mid|senior|any",
  "workType": "contract|full_time|any",
  "tools": ["tool1", "tool2"],
  "personalityTraits": ["trait1", "trait2"],
  "keywords": ["keyword1", "keyword2"]
}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a recruitment expert specializing in matching search queries to virtual assistant profiles. Respond only with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    let searchAnalysis;
    try {
      searchAnalysis = JSON.parse(completion.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return vas.map(va => ({ ...va, aiScore: 0 }));
    }

    // Score each VA based on the analysis
    const scoredVAs = vas.map(va => {
      const score = calculateVARelevanceScore(va, searchAnalysis, searchQuery);
      return {
        ...va,
        aiScore: score,
        searchAnalysis: searchAnalysis // Include analysis for debugging
      };
    });

    // Sort by AI score (highest first)
    return scoredVAs.sort((a, b) => b.aiScore - a.aiScore);

  } catch (error) {
    console.error('Error in AI search analysis:', error);
    // Fallback to original VAs without AI scoring
    return vas.map(va => ({ ...va, aiScore: 0 }));
  }
}

/**
 * Calculates relevance score for a VA based on AI analysis
 * @param {Object} va - VA object with all populated fields
 * @param {Object} analysis - AI analysis of the search query
 * @param {string} originalQuery - Original search query for fallback matching
 * @returns {number} - Relevance score (0-100)
 */
function calculateVARelevanceScore(va, analysis, originalQuery) {
  let score = 0;
  const maxScore = 100;

  // Convert VA data to searchable text
  const vaText = createVASearchText(va);
  const lowerVAText = vaText.toLowerCase();
  const lowerQuery = originalQuery.toLowerCase();

  // 1. Direct text matching (20 points max)
  if (lowerVAText.includes(lowerQuery)) {
    score += 20;
  }

  // 2. Skills matching (25 points max)
  if (analysis.skills && analysis.skills.length > 0) {
    const skillMatches = analysis.skills.filter(skill => 
      lowerVAText.includes(skill.toLowerCase()) ||
      (va.skills && va.skills.some(vaSkill => 
        vaSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(vaSkill.toLowerCase())
      ))
    );
    score += Math.min(25, (skillMatches.length / analysis.skills.length) * 25);
  }

  // 3. Industry matching (15 points max)
  if (analysis.industries && analysis.industries.length > 0) {
    const industryMatches = analysis.industries.filter(industry => 
      va.industry && va.industry.toLowerCase().includes(industry.toLowerCase())
    );
    score += Math.min(15, (industryMatches.length / analysis.industries.length) * 15);
  }

  // 4. Experience level matching (15 points max)
  if (analysis.experienceLevel && analysis.experienceLevel !== 'any') {
    if (va.roleLevel) {
      const levelMatch = checkExperienceLevelMatch(va.roleLevel, analysis.experienceLevel);
      if (levelMatch) score += 15;
    }
  }

  // 5. Work type matching (10 points max)
  if (analysis.workType && analysis.workType !== 'any') {
    if (va.roleType) {
      const typeMatch = checkWorkTypeMatch(va.roleType, analysis.workType);
      if (typeMatch) score += 10;
    }
  }

  // 6. Tools/Technology matching (10 points max)
  if (analysis.tools && analysis.tools.length > 0) {
    const toolMatches = analysis.tools.filter(tool => 
      lowerVAText.includes(tool.toLowerCase())
    );
    score += Math.min(10, (toolMatches.length / analysis.tools.length) * 10);
  }

  // 7. Keyword density bonus (5 points max)
  if (analysis.keywords && analysis.keywords.length > 0) {
    const keywordMatches = analysis.keywords.filter(keyword => 
      lowerVAText.includes(keyword.toLowerCase())
    );
    score += Math.min(5, (keywordMatches.length / analysis.keywords.length) * 5);
  }

  return Math.min(maxScore, score);
}

/**
 * Creates searchable text from VA data
 */
function createVASearchText(va) {
  const parts = [
    va.name || '',
    va.bio || '',
    va.hero || '',
    va.industry || '',
    va.videoTranscription || '',
    ...(va.skills || []),
    ...(va.certifications || []),
    ...(va.languages || []).map(lang => `${lang.language} ${lang.proficiency}`),
    ...(va.portfolio || []).map(p => `${p.title} ${p.description}`),
    va.specialties ? va.specialties.map(s => s.name || s).join(' ') : '',
    va.location ? (va.location.name || va.location) : '',
  ];

  return parts.filter(Boolean).join(' ').toLowerCase();
}

/**
 * Check if VA's experience level matches the required level
 */
function checkExperienceLevelMatch(roleLevel, requiredLevel) {
  const levelMap = {
    'junior': ['junior'],
    'mid': ['mid', 'junior'], // mid-level can also take junior roles
    'senior': ['senior', 'mid', 'principal', 'c_level'], // senior includes higher levels
    'principal': ['principal', 'c_level'],
    'c_level': ['c_level']
  };

  const vaLevels = Object.keys(roleLevel).filter(key => roleLevel[key] === true);
  const acceptedLevels = levelMap[requiredLevel] || [];

  return vaLevels.some(level => acceptedLevels.includes(level));
}

/**
 * Check if VA's work type matches the required type
 */
function checkWorkTypeMatch(roleType, requiredType) {
  const typeMap = {
    'contract': ['part_time_contract', 'full_time_contract'],
    'full_time': ['full_time_employment', 'full_time_contract']
  };

  const vaTypes = Object.keys(roleType).filter(key => roleType[key] === true);
  const acceptedTypes = typeMap[requiredType] || [];

  return vaTypes.some(type => acceptedTypes.includes(type));
}

/**
 * Fallback search function for when AI is not available
 */
function fallbackSearch(searchQuery, vas) {
  if (!searchQuery || searchQuery.trim() === '') {
    return vas;
  }

  const query = searchQuery.toLowerCase();
  
  return vas.map(va => {
    const vaText = createVASearchText(va);
    const matches = (vaText.match(new RegExp(query, 'gi')) || []).length;
    const relevanceScore = Math.min(100, matches * 10);
    
    return {
      ...va,
      aiScore: relevanceScore
    };
  }).sort((a, b) => b.aiScore - a.aiScore);
}

module.exports = {
  analyzeSearchQuery,
  fallbackSearch,
  createVASearchText
};