const mongoose = require('mongoose');

const swapRequestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Requester is required'],
      ref: 'User',
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Receiver is required'],
      ref: 'User',
    },
    offeredSlot: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Offered slot is required'],
      ref: 'Event',
    },
    requestedSlot: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Requested slot is required'],
      ref: 'Event',
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ['PENDING', 'ACCEPTED', 'REJECTED'],
        message: '{VALUE} is not a valid status',
      },
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
swapRequestSchema.index({ requester: 1, status: 1 });
swapRequestSchema.index({ receiver: 1, status: 1 });

const SwapRequest = mongoose.model('SwapRequest', swapRequestSchema);

module.exports = SwapRequest;
