const express = require('express');
const { createEvent, getMyEvents, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createEvent);
router.get('/my-events', protect, getMyEvents);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);

module.exports = router;
