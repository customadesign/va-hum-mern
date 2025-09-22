const mongoose = require('mongoose');

const savedVASchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  va: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VA',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  brand: {
    type: String,
    required: true,
    enum: ['esystems', 'linkage'],
    default: 'esystems'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  savedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound unique index to prevent duplicate saves
savedVASchema.index({ business: 1, va: 1 }, { unique: true });

// Index for querying by business (for listing saved VAs)
savedVASchema.index({ business: 1, savedAt: -1 });

// Index for querying by user
savedVASchema.index({ user: 1 });

// Index for brand filtering
savedVASchema.index({ brand: 1 });

// Virtual for populated VA details
savedVASchema.virtual('vaDetails', {
  ref: 'VA',
  localField: 'va',
  foreignField: '_id',
  justOne: true
});

// Static method to check if a VA is saved by a business
savedVASchema.statics.isSaved = async function(businessId, vaId) {
  const saved = await this.findOne({ business: businessId, va: vaId });
  return !!saved;
};

// Static method to get saved count for a business
savedVASchema.statics.getSavedCount = async function(businessId) {
  return await this.countDocuments({ business: businessId });
};

// Instance method to check if user can access this saved VA
savedVASchema.methods.canAccess = function(userId, userBrand) {
  return this.user.toString() === userId.toString() &&
         this.brand === userBrand;
};

const SavedVA = mongoose.model('SavedVA', savedVASchema);

module.exports = SavedVA;