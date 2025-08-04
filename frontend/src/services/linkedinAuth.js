// LinkedIn OAuth and API integration service
// Only used on E Systems side for employer login and profile auto-fill

const LINKEDIN_CONFIG = {
  clientId: process.env.REACT_APP_LINKEDIN_CLIENT_ID,
  redirectUri: `${window.location.origin}/auth/linkedin/callback`,
  scope: 'openid profile email w_organization_social', // Permissions needed
  state: 'esystems_auth_' + Math.random().toString(36).substring(7),
};

class LinkedInAuthService {
  constructor() {
    this.isESystemsMode = process.env.REACT_APP_BRAND === 'esystems';
  }

  // Check if LinkedIn integration is available (E Systems only)
  isAvailable() {
    return this.isESystemsMode && LINKEDIN_CONFIG.clientId;
  }

  // Generate LinkedIn OAuth URL for login
  getAuthUrl() {
    if (!this.isAvailable()) {
      throw new Error('LinkedIn integration is only available on E Systems');
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
      throw new Error('LinkedIn integration is only available on E Systems');
    }

    if (state !== LINKEDIN_CONFIG.state) {
      throw new Error('Invalid state parameter');
    }

    try {
      // Exchange code for access token via our backend
      const response = await fetch('/api/auth/linkedin/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to authenticate with LinkedIn');
      }

      const data = await response.json();
      return data; // Should include access_token and user profile
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      throw error;
    }
  }

  // Fetch company profile data from LinkedIn
  async getCompanyProfile(accessToken, companyId = null) {
    if (!this.isAvailable()) {
      throw new Error('LinkedIn integration is only available on E Systems');
    }

    try {
      // First, get user's organizations if no companyId provided
      if (!companyId) {
        const orgsResponse = await fetch('/api/linkedin/organizations', {
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
      const companyResponse = await fetch(`/api/linkedin/company/${companyId}`, {
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
      throw new Error('LinkedIn integration is only available on E Systems');
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