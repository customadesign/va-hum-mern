const mongoose = require('mongoose');

const teamMemberSchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['owner', 'admin', 'manager', 'member', 'viewer'],
    default: 'member',
    required: true
  },
  permissions: {
    canManageVAs: { type: Boolean, default: false },
    canManageTeam: { type: Boolean, default: false },
    canManageBilling: { type: Boolean, default: false },
    canViewAnalytics: { type: Boolean, default: true },
    canManageSettings: { type: Boolean, default: false },
    canManageIntegrations: { type: Boolean, default: false },
    canExportData: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'removed'],
    default: 'pending'
  },
  invitationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  invitationExpires: Date,
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  joinedAt: Date,
  lastActive: Date,
  department: String,
  title: String,
  phoneNumber: String,
  notes: String
}, {
  timestamps: true
});

// Indexes
teamMemberSchema.index({ business: 1, email: 1 }, { unique: true });
// Note: invitationToken index is automatically created by unique: true
teamMemberSchema.index({ business: 1, status: 1 });
teamMemberSchema.index({ user: 1 });

// Set permissions based on role before saving
teamMemberSchema.pre('save', function(next) {
  if (this.isModified('role')) {
    switch(this.role) {
      case 'owner':
        this.permissions = {
          canManageVAs: true,
          canManageTeam: true,
          canManageBilling: true,
          canViewAnalytics: true,
          canManageSettings: true,
          canManageIntegrations: true,
          canExportData: true
        };
        break;
      case 'admin':
        this.permissions = {
          canManageVAs: true,
          canManageTeam: true,
          canManageBilling: false,
          canViewAnalytics: true,
          canManageSettings: true,
          canManageIntegrations: true,
          canExportData: true
        };
        break;
      case 'manager':
        this.permissions = {
          canManageVAs: true,
          canManageTeam: false,
          canManageBilling: false,
          canViewAnalytics: true,
          canManageSettings: false,
          canManageIntegrations: false,
          canExportData: true
        };
        break;
      case 'member':
        this.permissions = {
          canManageVAs: false,
          canManageTeam: false,
          canManageBilling: false,
          canViewAnalytics: true,
          canManageSettings: false,
          canManageIntegrations: false,
          canExportData: false
        };
        break;
      case 'viewer':
        this.permissions = {
          canManageVAs: false,
          canManageTeam: false,
          canManageBilling: false,
          canViewAnalytics: true,
          canManageSettings: false,
          canManageIntegrations: false,
          canExportData: false
        };
        break;
    }
  }
  next();
});

module.exports = mongoose.model('TeamMember', teamMemberSchema);