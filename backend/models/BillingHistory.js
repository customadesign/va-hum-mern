const mongoose = require('mongoose');

const billingHistorySchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  type: {
    type: String,
    enum: ['charge', 'payment', 'refund', 'credit', 'subscription', 'invoice', 'adjustment'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'canceled', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  description: {
    type: String,
    required: true
  },
  // Invoice details
  invoice: {
    invoiceNumber: String,
    invoiceDate: Date,
    dueDate: Date,
    paidDate: Date,
    items: [{
      description: String,
      quantity: Number,
      unitPrice: Number,
      amount: Number
    }],
    subtotal: Number,
    tax: Number,
    total: Number,
    notes: String
  },
  // Payment method used
  paymentMethod: {
    type: String,
    last4: String,
    brand: String
  },
  // Stripe related IDs
  stripePaymentIntentId: String,
  stripeChargeId: String,
  stripeInvoiceId: String,
  stripeRefundId: String,
  // Metadata
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  // Error details if failed
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  // Admin who made manual changes
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  // Dates
  processedAt: Date,
  failedAt: Date,
  refundedAt: Date
}, {
  timestamps: true
});

// Indexes for efficient querying
billingHistorySchema.index({ business: 1, createdAt: -1 });
billingHistorySchema.index({ type: 1, status: 1 });
billingHistorySchema.index({ 'invoice.invoiceNumber': 1 });
billingHistorySchema.index({ stripeChargeId: 1 });
billingHistorySchema.index({ stripeInvoiceId: 1 });

// Virtual for formatted amount
billingHistorySchema.virtual('formattedAmount').get(function() {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency || 'USD'
  });
  return formatter.format(this.amount / 100); // Assuming amount is in cents
});

// Method to check if transaction can be refunded
billingHistorySchema.methods.canBeRefunded = function() {
  return this.type === 'charge' && 
         this.status === 'completed' && 
         !this.refundedAt;
};

// Static method to get billing summary for a business
billingHistorySchema.statics.getBillingSummary = async function(businessId, startDate, endDate) {
  const match = {
    business: mongoose.Types.ObjectId(businessId),
    status: 'completed'
  };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = startDate;
    if (endDate) match.createdAt.$lte = endDate;
  }
  
  const summary = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$type',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const result = {
    totalCharges: 0,
    totalPayments: 0,
    totalRefunds: 0,
    totalCredits: 0,
    netAmount: 0,
    transactionCounts: {}
  };
  
  summary.forEach(item => {
    result.transactionCounts[item._id] = item.count;
    switch(item._id) {
      case 'charge':
      case 'payment':
        result.totalPayments += item.totalAmount;
        break;
      case 'refund':
        result.totalRefunds += item.totalAmount;
        break;
      case 'credit':
        result.totalCredits += item.totalAmount;
        break;
    }
  });
  
  result.netAmount = result.totalPayments - result.totalRefunds;
  
  return result;
};

module.exports = mongoose.model('BillingHistory', billingHistorySchema);