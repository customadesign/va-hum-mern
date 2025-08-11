// LinkedIn OAuth and API integration service
// Only used on E Systems side for employer login and profile auto-fill

// Determine deployment URL based on brand
const getDeploymentUrl = () => {
  if (process.env.REACT_APP_BRAND === 'esystems') {
    return 'https://esystems-management-hub.onrender.com';
  }
  return 'https://linkage-va-hub.onrender.com';
};

// Backend API origin derived from REACT_APP_API_URL
const getApiOrigin = () => {
  try {
    const api = process.env.REACT_APP_API_URL || '';
    // If API URL already has /api, extract just the origin
    if (api.includes('/api')) {
      return api.replace('/api', '');
    }
    return new URL(api).origin;
  } catch (e) {
    console.error('Error parsing API URL:', e);
    // Fallback to known production URLs
    if (process.env.REACT_APP_BRAND === 'esystems') {
      return 'https://esystems-management-hub-api.onrender.com';
    }
    return 'https://linkage-va-hub-api.onrender.com';
  }
};

const LINKEDIN_CONFIG = {
  clientId: process.env.REACT_APP_LINKEDIN_CLIENT_ID,
  redirectUri: process.env.NODE_ENV === 'production' 
    ? `${getDeploymentUrl()}/auth/linkedin/callback`
    : 'http://localhost:3000/auth/linkedin/callback',
  scope: 'openid profile email', // Updated to use OpenID Connect scopes
  state: 'linkedin_auth_' + Math.random().toString(36).substring(7),
};

class LinkedInAuthService {
  constructor() {
    this.isESystemsMode = process.env.REACT_APP_BRAND === 'esystems';
    this.deploymentUrl = getDeploymentUrl();
    this.apiOrigin = getApiOrigin();
  }

  // Check if LinkedIn integration is available
  isAvailable() {
    return LINKEDIN_CONFIG.clientId; // Available for both deployments if configured
  }

  // Generate LinkedIn OAuth URL for login
  getAuthUrl() {
    if (!this.isAvailable()) {
      throw new Error('LinkedIn integration is not configured');
    }

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: LINKEDIN_CONFIG.clientId,
      redirect_uri: LINKEDIN_CONFIG.redirectUri,
      state: LINKEDIN_CONFIG.state,
      scope: LINKEDIN_CONFIG.scope,
    });

    return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
  }

  // Handle LinkedIn OAuth callback
  async handleCallback(code, state) {
    if (!this.isAvailable()) {
      throw new Error('LinkedIn integration is not configured');
    }

    // Note: State validation should be done but we're using a dynamic state
    // In production, store state in sessionStorage before redirect

    try {
      // Exchange code for access token via our backend
      const apiBase = process.env.NODE_ENV === 'production'
        ? this.apiOrigin
        : 'http://localhost:5000';
      
      const callbackUrl = `${apiBase}/api/auth/linkedin/callback`;
      
      console.log('LinkedIn callback URL:', callbackUrl);
      console.log('Sending code to backend for exchange');

      const response = await fetch(callbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
        credentials: 'include', // Important for CORS
      });

      // Parse JSON defensively to surface any HTML/error responses clearly
      let data;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (err) {
          console.error('Failed to parse JSON response:', err);
          throw new Error('Invalid JSON response from server');
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON response received:', text);
        throw new Error('Server returned non-JSON response. This might be a CORS or routing issue.');
      }
      
      if (!response.ok) {
        console.error('LinkedIn authentication failed:', data);
        throw new Error(data.error || data.details || 'Failed to authenticate with LinkedIn');
      }
      
      return data; // Should include success, token, and user profile
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      throw error;
    }
  }

  // Fetch company profile data from LinkedIn
  async getCompanyProfile(accessToken, companyId = null) {
    if (!this.isAvailable()) {
      throw new Error('LinkedIn integration is not configured');
    }

    try {
      // First, get user's organizations if no companyId provided
      const apiBase = process.env.NODE_ENV === 'production'
        ? this.apiOrigin
        : 'http://localhost:5000';
        
      if (!companyId) {
        const orgsResponse = await fetch(`${apiBase}/api/linkedin/organizations`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!orgsResponse.ok) {
          throw new Error('Failed to fetch user organizations');
        }

        const organizations = await orgsResponse.json();
        if (organizations.elements && organizations.elements.length > 0) {
          companyId = organizations.elements[0].organizationalTarget;
        } else {
          throw new Error('No organizations found for this user');
        }
      }

      // Get company profile data
      const companyResponse = await fetch(`${apiBase}/api/linkedin/company/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!companyResponse.ok) {
        throw new Error('Failed to fetch company profile');
      }

      const companyData = await companyResponse.json();
      return this.mapLinkedInDataToProfile(companyData);
    } catch (error) {
      console.error('Error fetching company profile:', error);
      throw error;
    }
  }

  // Map LinkedIn company data to our business profile format
  mapLinkedInDataToProfile(linkedinData) {
    const mappedData = {
      // Basic company information
      company: linkedinData.name || '',
      bio: linkedinData.description || '',
      website: linkedinData.website?.url || '',
      industry: this.mapLinkedInIndustry(linkedinData.industry),
      
      // Company details
      companySize: this.mapLinkedInCompanySize(linkedinData.staffCount),
      foundedYear: linkedinData.foundedOn?.year || null,
      headquartersLocation: this.formatHeadquarters(linkedinData.headquarters),
      
      // Professional information
      missionStatement: linkedinData.tagline || '',
      companyCulture: linkedinData.description || '',
      
      // Specialties from LinkedIn
      specialties: linkedinData.specialties || [],
      
      // Social media (LinkedIn will provide their own profile)
      linkedin: `https://www.linkedin.com/company/${linkedinData.id}`,
      
      // Location details
      streetAddress: linkedinData.headquarters?.address?.streetAddress1 || '',
      city: linkedinData.headquarters?.address?.city || '',
      state: linkedinData.headquarters?.address?.geographicArea || '',
      postalCode: linkedinData.headquarters?.address?.postalCode || '',
      country: linkedinData.headquarters?.address?.country || '',
      
      // Company logo
      avatar: linkedinData.logoV2?.original || '',
    };

    return mappedData;
  }

  // Map LinkedIn industry to our industry options
  mapLinkedInIndustry(linkedinIndustry) {
    const industryMappings = {
      'ACCOUNTING': 'Accounting',
      'ADVERTISING_AND_MARKETING': 'Advertising & Marketing',
      'AUTOMOTIVE': 'Automotive',
      'BANKING': 'Banking',
      'BIOTECHNOLOGY': 'Biotechnology',
      'CONSTRUCTION': 'Construction',
      'CONSULTING': 'Consulting',
      'EDUCATION': 'Education',
      'ENGINEERING': 'Engineering',
      'FINANCIAL_SERVICES': 'Financial Services',
      'GOVERNMENT': 'Government',
      'HEALTHCARE': 'Healthcare',
      'HOSPITALITY': 'Hospitality',
      'HUMAN_RESOURCES': 'Human Resources',
      'INFORMATION_TECHNOLOGY': 'Information Technology',
      'INSURANCE': 'Insurance',
      'INTERNET': 'Internet',
      'LEGAL': 'Legal',
      'MANUFACTURING': 'Manufacturing',
      'MEDIA_AND_COMMUNICATIONS': 'Media & Communications',
      'NON_PROFIT': 'Non-profit',
      'REAL_ESTATE': 'Real Estate',
      'RETAIL': 'Retail',
      'SOFTWARE': 'Software',
      'TELECOMMUNICATIONS': 'Telecommunications',
      'TRANSPORTATION': 'Transportation',
    };

    return industryMappings[linkedinIndustry] || 'Other';
  }

  // Map LinkedIn company size to our size options
  mapLinkedInCompanySize(staffCount) {
    if (!staffCount) return '';
    
    const count = staffCount.end || staffCount.start || 0;
    
    if (count <= 10) return '1-10';
    if (count <= 50) return '11-50';
    if (count <= 200) return '51-200';
    if (count <= 500) return '201-500';
    if (count <= 1000) return '501-1000';
    if (count <= 5000) return '1001-5000';
    if (count <= 10000) return '5001-10000';
    return '10000+';
  }

  // Format headquarters location
  formatHeadquarters(headquarters) {
    if (!headquarters?.address) return '';
    
    const { city, geographicArea, country } = headquarters.address;
    const parts = [city, geographicArea, country].filter(Boolean);
    return parts.join(', ');
  }

  // Initiate LinkedIn login flow
  login() {
    if (!this.isAvailable()) {
      throw new Error('LinkedIn integration is not configured');
    }

    const authUrl = this.getAuthUrl();
    window.location.href = authUrl;
  }

  // Auto-fill profile form with LinkedIn data
  autoFillProfile(linkedinData, formikSetValues) {
    const mappedData = this.mapLinkedInDataToProfile(linkedinData);
    
    // Set form values using Formik's setValues
    formikSetValues({
      ...formikSetValues,
      ...mappedData,
    });

    return mappedData;
  }
}

export default new LinkedInAuthService();