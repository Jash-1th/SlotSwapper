const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Owner is required'],
      ref: 'User',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: [
        function(value) {
          return value > this.startTime;
        },
        'End time must be after start time'
      ]
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['BUSY', 'SWAPPABLE', 'SWAP_PENDING'],
        message: '{VALUE} is not a valid status',
      },
      default: 'BUSY',
    },
  },
  {
    timestamps: true,
  }
);

// Validation to ensure endTime is after startTime
eventSchema.pre('save', function (next) {
  if (this.endTime <= this.startTime) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
