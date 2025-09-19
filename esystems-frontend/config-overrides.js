const path = require('path');
const fs = require('fs');

module.exports = function override(config, env) {
  // Force the entry point to be the esystems-frontend index.js
  const appIndexJs = path.resolve(__dirname, 'src/index.js');
  
  // Check if our index.js exists
  if (!fs.existsSync(appIndexJs)) {
    console.error('ERROR: esystems-frontend/src/index.js does not exist!');
    console.error('Expected path:', appIndexJs);
  }
  
  // Override the entry point
  if (config.entry) {
    if (Array.isArray(config.entry)) {
      config.entry = config.entry.map(entry => {
        if (entry.includes('index.js')) {
          return appIndexJs;
        }
        return entry;
      });
    } else if (typeof config.entry === 'string') {
      if (config.entry.includes('index.js')) {
        config.entry = appIndexJs;
      }
    }
  }

  // Ensure webpack only looks in the esystems-frontend src directory
  config.resolve.modules = [
    path.resolve(__dirname, 'src'),
    path.resolve(__dirname, 'node_modules'),
    'node_modules'
  ];

  // Remove any module resolution that might point to the parent frontend
  if (config.resolve.alias) {
    Object.keys(config.resolve.alias).forEach(key => {
      if (config.resolve.alias[key] && config.resolve.alias[key].includes('../frontend')) {
        delete config.resolve.alias[key];
      }
    });
  }

  // Ensure babel-loader only processes files within esystems-frontend
  const oneOfRule = config.module.rules.find(rule => rule.oneOf);
  if (oneOfRule) {
    oneOfRule.oneOf.forEach(rule => {
      if (rule.loader && rule.loader.includes('babel-loader')) {
        rule.include = path.resolve(__dirname, 'src');
        rule.exclude = [
          /node_modules/,
          path.resolve(__dirname, '../frontend')
        ];
      }
    });
  }

  // Log the configuration for debugging
  console.log('Webpack entry:', config.entry);
  console.log('Webpack resolve.modules:', config.resolve.modules);
  
  return config;
};