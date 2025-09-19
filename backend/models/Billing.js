const mongoose = require('mongoose');

const billingSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
    unique: true
  },
  stripeCustomerId: {
    type: String,
    required: true,
    unique: true
  },
  // Payment methods (stored securely via Stripe)
  paymentMethods: [{
    stripePaymentMethodId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['card'],
      default: 'card'
    },
    card: {
      brand: String,      // visa, mastercard, amex, etc
      last4: String,      // Last 4 digits of card
      expMonth: Number,
      expYear: Number
    },
    isDefault: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Billing address
  billingAddress: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    postalCode: String,
    country: {
      type: String,
      default: 'US'
    }
  },
  // Payment history
  payments: [{
    stripePaymentIntentId: {
      type: String,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'usd'
    },
    status: {
      type: String,
      enum: ['succeeded', 'processing', 'requires_payment_method', 'requires_confirmation', 'requires_action', 'canceled', 'failed'],
      required: true
    },
    description: String,
    receiptUrl: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Subscription/trial information
  currentTrial: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trial'
  },
  // Statistics
  totalSpent: {
    type: Number,
    default: 0
  },
  lastPaymentDate: Date,
  // Settings
  autoRenew: {
    type: Boolean,
    default: false
  },
  notifications: {
    paymentSuccess: {
      type: Boolean,
      default: true
    },
    paymentFailed: {
      type: Boolean,
      default: true
    },
    trialExpiring: {
      type: Boolean,
      default: true
    },
    hoursLow: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
// Note: business index is automatically created by unique: true
// Note: stripeCustomerId index is automatically created by unique: true
billingSchema.index({ 'payments.stripePaymentIntentId': 1 });

// Method to get default payment method
billingSchema.methods.getDefaultPaymentMethod = function() {
  return this.paymentMethods.find(pm => pm.isDefault) || this.paymentMethods[0];
};

// Method to set default payment method
billingSchema.methods.setDefaultPaymentMethod = function(paymentMethodId) {
  this.paymentMethods.forEach(pm => {
    pm.isDefault = pm.stripePaymentMethodId === paymentMethodId;
  });
  return this.save();
};

// Method to add payment record
billingSchema.methods.addPayment = function(paymentData) {
  this.payments.push(paymentData);
  this.totalSpent += paymentData.amount;
  this.lastPaymentDate = new Date();
  return this.save();
};

// Virtual for checking if has valid payment method
billingSchema.virtual('hasValidPaymentMethod').get(function() {
  return this.paymentMethods && this.paymentMethods.length > 0;
});

// Virtual for checking if billing address is complete
billingSchema.virtual('hasBillingAddress').get(function() {
  return this.billingAddress && 
         this.billingAddress.line1 && 
         this.billingAddress.city && 
         this.billingAddress.state && 
         this.billingAddress.postalCode;
});

module.exports = mongoose.model('Billing', billingSchema);