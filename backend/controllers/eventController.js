const Event = require('../models/eventModel');

const createEvent = async (req, res) => {
  try {
    const { title, startTime, endTime } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Please provide all fields' });
    }

    const now = new Date();
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const oneMinuteAgo = new Date(now.getTime() - 60000);
    
    if (startDate < oneMinuteAgo) {
      return res.status(400).json({ message: 'Cannot create an event in the past' });
    }

    // Check for overlapping events
    const overlappingEvent = await Event.findOne({
      owner: req.user.id,
      $or: [
        // Existing event starts before the new one ends AND ends after the new one starts
        { 
          startTime: { $lt: endDate },
          endTime: { $gt: startDate }
        }
      ]
    });

    if (overlappingEvent) {
      return res.status(400).json({ message: 'This event overlaps with an existing event in your calendar.' });
    }

    const event = await Event.create({
      owner: req.user.id,
      title,
      startTime,
      endTime,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ owner: req.user.id }).sort({ startTime: 1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this event' });
    }

    const { title, startTime, endTime, status } = req.body;

    if (startTime || endTime) {
      const now = new Date();
      const newStartTime = startTime ? new Date(startTime) : event.startTime;
      const newEndTime = endTime ? new Date(endTime) : event.endTime;
      const oneMinuteAgo = new Date(now.getTime() - 60000);
      
      if (newStartTime < oneMinuteAgo) {
        return res.status(400).json({ message: 'Cannot set event start time in the past' });
      }

      // Check for overlapping events, excluding the current event
      const overlappingEvent = await Event.findOne({
        _id: { $ne: req.params.id }, // Exclude current event
        owner: req.user.id,
        $or: [
          { 
            startTime: { $lt: newEndTime },
            endTime: { $gt: newStartTime }
          }
        ]
      });

      if (overlappingEvent) {
        return res.status(400).json({ message: 'This update would create an overlap with an existing event in your calendar.' });
      }
    }

    if (title) event.title = title;
    if (startTime) event.startTime = startTime;
    if (endTime) event.endTime = endTime;
    if (status) event.status = status;

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (event.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createEvent, getMyEvents, updateEvent, deleteEvent };
