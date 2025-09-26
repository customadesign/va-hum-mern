import React from 'react';

const CreditCardPreview = ({ 
  cardNumber = '', 
  cardholderName = '', 
  expiryDate = '', 
  cvc = '',
  cardBrand = 'generic',
  isFlipped = false 
}) => {
  // Format card number with spaces and mask
  const formatCardNumber = (number) => {
    if (!number) return '•••• •••• •••• ••••';
    
    // Remove all non-digits
    const cleaned = number.replace(/\D/g, '');
    
    // Pad with dots if needed
    const padded = cleaned.padEnd(16, '•');
    
    // Add spaces every 4 digits
    return padded.replace(/(.{4})/g, '$1 ').trim();
  };

  // Format expiry date
  const formatExpiryDate = (expiry) => {
    if (!expiry) return '••/••';
    return expiry.length >= 2 ? expiry : expiry.padEnd(5, '•');
  };

  // Format CVC
  const formatCVC = (cvcValue) => {
    if (!cvcValue) return '•••';
    return cvcValue.padEnd(3, '•');
  };

  // Get card brand colors and styles
  const getCardBrandStyle = (brand) => {
    switch (brand?.toLowerCase()) {
      case 'visa':
        return {
          gradient: 'from-blue-600 to-blue-800',
          logo: 'VISA',
          textColor: 'text-white'
        };
      case 'mastercard':
        return {
          gradient: 'from-red-500 to-orange-600',
          logo: 'Mastercard',
          textColor: 'text-white'
        };
      case 'amex':
      case 'american express':
        return {
          gradient: 'from-green-600 to-teal-700',
          logo: 'AMEX',
          textColor: 'text-white'
        };
      case 'discover':
        return {
          gradient: 'from-orange-500 to-orange-700',
          logo: 'DISCOVER',
          textColor: 'text-white'
        };
      default:
        return {
          gradient: 'from-gray-700 to-gray-900',
          logo: 'CARD',
          textColor: 'text-white'
        };
    }
  };

  const cardStyle = getCardBrandStyle(cardBrand);

  return (
    <div className="relative w-80 h-48 mx-auto mb-6">
      {/* Card Container with 3D flip effect */}
      <div 
        className={`relative w-full h-full transition-transform duration-700 transform-style-preserve-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front of Card */}
        <div className={`absolute inset-0 w-full h-full rounded-xl shadow-2xl bg-gradient-to-br ${cardStyle.gradient} backface-hidden`}>
          {/* Card Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-16 h-16 rounded-full border-2 border-white opacity-30"></div>
            <div className="absolute top-8 right-8 w-12 h-12 rounded-full border-2 border-white opacity-20"></div>
            <div className="absolute bottom-4 left-4 w-20 h-20 rounded-full border border-white opacity-20"></div>
          </div>

          {/* Card Content */}
          <div className="relative z-10 p-6 h-full flex flex-col justify-between">
            {/* Top Section - Logo and Chip */}
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                {/* EMV Chip */}
                <div className="w-8 h-6 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-sm shadow-inner">
                  <div className="w-full h-full bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-sm border border-yellow-600 opacity-80"></div>
                </div>
              </div>
              
              {/* Card Brand Logo */}
              <div className={`text-right ${cardStyle.textColor}`}>
                <div className="text-lg font-bold tracking-wider opacity-90">
                  {cardStyle.logo}
                </div>
              </div>
            </div>

            {/* Middle Section - Card Number */}
            <div className={`${cardStyle.textColor}`}>
              <div className="text-xl font-mono tracking-wider mb-1">
                {formatCardNumber(cardNumber)}
              </div>
            </div>

            {/* Bottom Section - Name and Expiry */}
            <div className={`flex justify-between items-end ${cardStyle.textColor}`}>
              <div>
                <div className="text-xs opacity-70 uppercase tracking-wide mb-1">
                  Cardholder Name
                </div>
                <div className="text-sm font-medium uppercase tracking-wide">
                  {cardholderName || 'YOUR NAME HERE'}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xs opacity-70 uppercase tracking-wide mb-1">
                  Expires
                </div>
                <div className="text-sm font-mono">
                  {formatExpiryDate(expiryDate)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back of Card */}
        <div className={`absolute inset-0 w-full h-full rounded-xl shadow-2xl bg-gradient-to-br ${cardStyle.gradient} backface-hidden rotate-y-180`}>
          {/* Magnetic Stripe */}
          <div className="w-full h-12 bg-black mt-6"></div>
          
          {/* Signature Strip and CVC */}
          <div className="p-6 pt-4">
            <div className="bg-white h-8 rounded mb-4 flex items-center justify-end px-3">
              <span className="text-black text-sm font-mono">
                {formatCVC(cvc)}
              </span>
            </div>
            
            {/* Security Features Text */}
            <div className={`text-xs ${cardStyle.textColor} opacity-70 space-y-1`}>
              <p>This card is property of the cardholder.</p>
              <p>Misuse is criminal fraud.</p>
              <p>Call issuer to report lost or stolen card.</p>
            </div>

            {/* Card Brand Logo on Back */}
            <div className={`absolute bottom-6 right-6 ${cardStyle.textColor} opacity-60`}>
              <div className="text-sm font-bold tracking-wider">
                {cardStyle.logo}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flip Instruction */}
      <div className="text-center mt-4">
        <button
          onClick={() => {}} // This will be controlled by parent component
          className="text-xs text-gray-700 hover:text-gray-700 transition-colors"
        >
          {isFlipped ? 'Click to see front' : 'Click to see back'}
        </button>
      </div>
    </div>
  );
};

export default CreditCardPreview;
