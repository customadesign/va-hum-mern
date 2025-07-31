const isESystemsMode = () => {
  return process.env.ESYSTEMS_MODE === 'true' || process.env.PORT === '3001';
};

const getESystemsBranding = () => {
  if (isESystemsMode()) {
    return {
      name: 'E-Systems Management',
      logo: 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png',
      logoUrl: 'https://storage.googleapis.com/msgsndr/dXPpkZ3hX5PCKayZrLsI/media/66fb8d59595de9f3ad14ac4c.png',
      primaryColor: '#1f2937',
      accentColor: '#3b82f6',
      allowVARegistration: false,
      allowBusinessRegistration: true,
      userType: 'business'
    };
  }
  
  return {
    name: 'Linkage VA Hub',
    logo: 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
    logoUrl: 'https://storage.googleapis.com/msgsndr/H12yHzS5PDSz1dtmxbxH/media/688ab56f0299a1fefc1986e5.png',
    primaryColor: '#1f2937',
    accentColor: '#3b82f6',
    allowVARegistration: true,
    allowBusinessRegistration: true,
    userType: 'va'
  };
};

module.exports = {
  isESystemsMode,
  getESystemsBranding
};