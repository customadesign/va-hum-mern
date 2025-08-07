const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot be more than 2000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  subtasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  relatedTo: {
    type: {
      type: String,
      enum: ['va', 'business', 'conversation', 'course']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'relatedTo.model'
    },
    model: {
      type: String,
      enum: ['VA', 'Business', 'Conversation', 'Course']
    }
  },
  aiMetadata: {
    model: String,
    tokens: Number,
    temperature: Number,
    generatedSubtasks: Boolean,
    lastAIUpdate: Date
  },
  estimatedHours: {
    type: Number,
    min: 0
  },
  actualHours: {
    type: Number,
    min: 0
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringSchedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    interval: Number,
    endDate: Date,
    nextOccurrence: Date
  }
}, {
  timestamps: true
});

taskSchema.index({ createdBy: 1, status: 1 });
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ dueDate: 1 });
taskSchema.index({ priority: 1, status: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ 'relatedTo.type': 1, 'relatedTo.id': 1 });

taskSchema.pre('save', function(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  next();
});

taskSchema.methods.markComplete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

taskSchema.methods.addSubtask = function(title) {
  this.subtasks.push({ title });
  return this.save();
};

taskSchema.methods.completeSubtask = function(subtaskId) {
  const subtask = this.subtasks.id(subtaskId);
  if (subtask) {
    subtask.completed = true;
    subtask.completedAt = new Date();
  }
  return this.save();
};

taskSchema.statics.getTasksByUser = function(userId, options = {}) {
  const query = {
    $or: [
      { createdBy: userId },
      { assignedTo: userId }
    ]
  };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.priority) {
    query.priority = options.priority;
  }
  
  return this.find(query)
    .populate('assignedTo', 'name email')
    .populate('createdBy', 'name email')
    .sort(options.sort || '-createdAt');
};

module.exports = mongoose.model('Task', taskSchema);