import React from 'react';

const PasswordStrength = ({ password }) => {
  const calculateStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    
    let score = 0;
    const checks = {
      length: pwd.length >= 8,
      lowercase: /[a-z]/.test(pwd),
      uppercase: /[A-Z]/.test(pwd),
      numbers: /[0-9]/.test(pwd),
      special: /[^A-Za-z0-9]/.test(pwd),
    };
    
    // Add points for each check passed
    if (checks.length) score += 2;
    if (pwd.length >= 12) score += 1;
    if (checks.lowercase) score += 1;
    if (checks.uppercase) score += 1;
    if (checks.numbers) score += 1;
    if (checks.special) score += 2;
    
    // Determine strength label and color
    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' };
    if (score <= 4) return { score: 2, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 6) return { score: 3, label: 'Good', color: 'bg-yellow-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = calculateStrength(password);
  
  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-700">Password strength:</span>
        <span className={`text-xs font-medium ${
          strength.label === 'Weak' ? 'text-red-600' :
          strength.label === 'Fair' ? 'text-orange-600' :
          strength.label === 'Good' ? 'text-yellow-600' :
          'text-green-600'
        }`}>
          {strength.label}
        </span>
      </div>
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`flex-1 h-1 rounded-full transition-all duration-300 ${
              level <= strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-gray-700">
        {strength.score < 4 && (
          <ul className="space-y-1">
            {!password || password.length < 8 ? (
              <li>• Use at least 8 characters</li>
            ) : null}
            {!/[a-z]/.test(password) && <li>• Include lowercase letters</li>}
            {!/[A-Z]/.test(password) && <li>• Include uppercase letters</li>}
            {!/[0-9]/.test(password) && <li>• Include numbers</li>}
            {!/[^A-Za-z0-9]/.test(password) && <li>• Include special characters</li>}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PasswordStrength;