const mongoose = require('mongoose');

const roleLevelSchema = new mongoose.Schema({
  va: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VA',
    required: true,
    unique: true
  },
  junior: {
    type: Boolean,
    default: false
  },
  mid: {
    type: Boolean,
    default: false
  },
  senior: {
    type: Boolean,
    default: false
  },
  principal: {
    type: Boolean,
    default: false
  },
  cLevel: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for VA lookup
// Note: va already has unique index from schema definition

// Virtual to get all selected levels as array
roleLevelSchema.virtual('selectedLevels').get(function() {
  const levels = [];
  if (this.junior) levels.push('junior');
  if (this.mid) levels.push('mid');
  if (this.senior) levels.push('senior');
  if (this.principal) levels.push('principal');
  if (this.cLevel) levels.push('c_level');
  return levels;
});

// Virtual to get highest level
roleLevelSchema.virtual('highestLevel').get(function() {
  if (this.cLevel) return 'c_level';
  if (this.principal) return 'principal';
  if (this.senior) return 'senior';
  if (this.mid) return 'mid';
  if (this.junior) return 'junior';
  return null;
});

// Method to set levels from array
roleLevelSchema.methods.setLevels = function(levels) {
  this.junior = levels.includes('junior');
  this.mid = levels.includes('mid');
  this.senior = levels.includes('senior');
  this.principal = levels.includes('principal');
  this.cLevel = levels.includes('c_level');
};

module.exports = mongoose.model('RoleLevel', roleLevelSchema);