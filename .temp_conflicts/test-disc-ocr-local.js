const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// Test the OCR extraction with the local DISC screenshot
async function testLocalDiscOCR() {
  const imagePath = path.join(__dirname, '../Debugging /disc.jpg');
  
  console.log('Testing OCR with local DISC screenshot:', imagePath);
  
  if (!fs.existsSync(imagePath)) {
    console.error('Image not found:', imagePath);
    return;
  }

  try {
    // Initialize Tesseract worker
    const worker = await createWorker('eng');
    
    // Perform OCR on the image
    const { data: { text } } = await worker.recognize(imagePath);
    console.log('\n=== EXTRACTED TEXT ===');
    console.log(text);
    console.log('======================\n');
    
    // Extract scores from the text
    const scores = extractDiscScores(text);
    console.log('\n=== EXTRACTED SCORES ===');
    console.log('Primary Type:', scores.primaryType);
    console.log('Dominance:', scores.dominance);
    console.log('Influence:', scores.influence);
    console.log('Steadiness:', scores.steadiness);
    console.log('Conscientiousness:', scores.conscientiousness);
    console.log('========================\n');
    
    // Terminate the worker
    await worker.terminate();
    
  } catch (error) {
    console.error('OCR processing error:', error);
  }
}

// Copy the extraction function from the controller
function extractDiscScores(text) {
  const scores = {
    dominance: null,
    influence: null,
    steadiness: null,
    conscientiousness: null,
    primaryType: null
  };

  // Clean up the text
  const cleanText = text.replace(/\s+/g, ' ').toLowerCase();
  
  // Check for OSPP DISC Assessment Test format
  if (cleanText.includes('ospp disc assessment') || cleanText.includes('your highest score was for type')) {
    // Extract primary type from "Your highest score was for Type X"
    const primaryMatch = cleanText.match(/your highest score was for type ([disc])/i);
    if (primaryMatch) {
      scores.primaryType = primaryMatch[1].toUpperCase();
      
      // Provide estimated scores based on primary type
      if (scores.primaryType === 'D') {
        scores.dominance = 75;
        scores.influence = 35;
        scores.steadiness = 45;
        scores.conscientiousness = 55;
      } else if (scores.primaryType === 'I') {
        scores.influence = 75;
        scores.dominance = 45;
        scores.steadiness = 35;
        scores.conscientiousness = 40;
      } else if (scores.primaryType === 'S') {
        scores.steadiness = 75;
        scores.dominance = 35;
        scores.influence = 40;
        scores.conscientiousness = 50;
      } else if (scores.primaryType === 'C') {
        scores.conscientiousness = 75;
        scores.dominance = 40;
        scores.influence = 35;
        scores.steadiness = 45;
      }
      
      console.log('Note: OSPP test format detected. Scores are estimated based on primary type.');
      return scores;
    }
  }

  // Try other patterns for different test formats
  const patterns = [
    { key: 'dominance', patterns: [/dominance[:\s]+(\d+)%?/i, /\bd[:\s]+(\d+)%?/i] },
    { key: 'influence', patterns: [/influence[:\s]+(\d+)%?/i, /\bi[:\s]+(\d+)%?/i] },
    { key: 'steadiness', patterns: [/steadiness[:\s]+(\d+)%?/i, /\bs[:\s]+(\d+)%?/i] },
    { key: 'conscientiousness', patterns: [/conscientiousness[:\s]+(\d+)%?/i, /compliance[:\s]+(\d+)%?/i, /\bc[:\s]+(\d+)%?/i] },
  ];

  patterns.forEach(({ key, patterns: regexPatterns }) => {
    for (const pattern of regexPatterns) {
      const match = cleanText.match(pattern);
      if (match && match[1]) {
        const score = parseInt(match[1]);
        if (score >= 0 && score <= 100) {
          scores[key] = score;
          break;
        }
      }
    }
  });

  // Determine primary type based on highest score
  const scoreValues = {
    D: scores.dominance || 0,
    I: scores.influence || 0,
    S: scores.steadiness || 0,
    C: scores.conscientiousness || 0
  };

  const maxScore = Math.max(...Object.values(scoreValues));
  if (maxScore > 0) {
    const primaryTypes = Object.keys(scoreValues).filter(key => scoreValues[key] === maxScore);
    scores.primaryType = primaryTypes[0];
  }

  return scores;
}

// Run the test
testLocalDiscOCR();