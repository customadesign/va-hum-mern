const mongoose = require('mongoose');

const roleTypeSchema = new mongoose.Schema({
  va: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VA',
    required: true,
    unique: true
  },
  partTimeContract: {
    type: Boolean,
    default: false
  },
  fullTimeContract: {
    type: Boolean,
    default: false
  },
  fullTimeEmployment: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for VA lookup
// Note: va already has unique index from schema definition

// Virtual to get all selected types as array
roleTypeSchema.virtual('selectedTypes').get(function() {
  const types = [];
  if (this.partTimeContract) types.push('part_time_contract');
  if (this.fullTimeContract) types.push('full_time_contract');
  if (this.fullTimeEmployment) types.push('full_time_employment');
  return types;
});

// Method to set types from array
roleTypeSchema.methods.setTypes = function(types) {
  this.partTimeContract = types.includes('part_time_contract');
  this.fullTimeContract = types.includes('full_time_contract');
  this.fullTimeEmployment = types.includes('full_time_employment');
};

module.exports = mongoose.model('RoleType', roleTypeSchema);