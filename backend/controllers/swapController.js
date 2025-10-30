const Event = require('../models/eventModel');
const SwapRequest = require('../models/swapRequestModel');
const mongoose = require('mongoose');

const getSwappableSlots = async (req, res) => {
  try {
    const swappableSlots = await Event.find({
      status: 'SWAPPABLE',
      owner: { $ne: req.user.id },
    })
      .populate('owner', 'name email')
      .sort({ startTime: 1 });

    res.json(swappableSlots);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createSwapRequest = async (req, res) => {
  try {
    const { mySlotId, theirSlotId } = req.body;

    if (!mySlotId || !theirSlotId) {
      return res.status(400).json({ message: 'Please provide both slot IDs' });
    }

    const mySlot = await Event.findById(mySlotId);
    const theirSlot = await Event.findById(theirSlotId);

    if (!mySlot) {
      return res.status(404).json({ message: 'Your slot not found' });
    }

    if (!theirSlot) {
      return res.status(404).json({ message: 'Their slot not found' });
    }

    if (mySlot.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'You do not own this slot' });
    }

    if (theirSlot.owner.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot swap with your own slot' });
    }

    if (mySlot.status !== 'SWAPPABLE') {
      return res.status(400).json({ message: 'Your slot is not swappable' });
    }

    if (theirSlot.status !== 'SWAPPABLE') {
      return res.status(400).json({ message: 'Their slot is not swappable' });
    }

    const swapRequest = await SwapRequest.create({
      requester: req.user.id,
      receiver: theirSlot.owner,
      offeredSlot: mySlotId,
      requestedSlot: theirSlotId,
    });

    mySlot.status = 'SWAP_PENDING';
    theirSlot.status = 'SWAP_PENDING';

    await mySlot.save();
    await theirSlot.save();

    res.status(201).json(swapRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const respondToSwapRequest = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { requestId } = req.params;
    const { acceptance } = req.body;

    if (typeof acceptance !== 'boolean') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Acceptance must be a boolean' });
    }

    const swapRequest = await SwapRequest.findById(requestId).session(session);

    if (!swapRequest) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Swap request not found' });
    }

    if (swapRequest.status !== 'PENDING') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Swap request is not pending' });
    }

    if (swapRequest.receiver.toString() !== req.user.id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Not authorized to respond to this request' });
    }

    const offeredSlot = await Event.findById(swapRequest.offeredSlot).session(session);
    const requestedSlot = await Event.findById(swapRequest.requestedSlot).session(session);

    if (!offeredSlot || !requestedSlot) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'One or both slots not found' });
    }

    if (acceptance === false) {
      swapRequest.status = 'REJECTED';
      offeredSlot.status = 'SWAPPABLE';
      requestedSlot.status = 'SWAPPABLE';

      await swapRequest.save({ session });
      await offeredSlot.save({ session });
      await requestedSlot.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.json({ message: 'Swap request rejected', swapRequest });
    }

    if (acceptance === true) {
      swapRequest.status = 'ACCEPTED';

      const originalOfferedOwner = offeredSlot.owner;
      const originalRequestedOwner = requestedSlot.owner;

      offeredSlot.owner = originalRequestedOwner;
      requestedSlot.owner = originalOfferedOwner;

      offeredSlot.status = 'BUSY';
      requestedSlot.status = 'BUSY';

      await swapRequest.save({ session });
      await offeredSlot.save({ session });
      await requestedSlot.save({ session });

      await session.commitTransaction();
      session.endSession();

      return res.json({ message: 'Swap request accepted', swapRequest });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

const getIncomingRequests = async (req, res) => {
  try {
    const incomingRequests = await SwapRequest.find({
      receiver: req.user.id,
      status: 'PENDING',
    })
      .populate('requester', 'name email')
      .populate('receiver', 'name email')
      .populate('offeredSlot')
      .populate('requestedSlot')
      .sort({ createdAt: -1 });

    res.json(incomingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOutgoingRequests = async (req, res) => {
  try {
    const outgoingRequests = await SwapRequest.find({
      requester: req.user.id,
      status: 'PENDING',
    })
      .populate('requester', 'name email')
      .populate('receiver', 'name email')
      .populate('offeredSlot')
      .populate('requestedSlot')
      .sort({ createdAt: -1 });

    res.json(outgoingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getSwappableSlots, createSwapRequest, respondToSwapRequest, getIncomingRequests, getOutgoingRequests };
