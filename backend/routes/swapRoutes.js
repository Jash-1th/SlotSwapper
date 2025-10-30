const express = require('express');
const { getSwappableSlots, createSwapRequest, respondToSwapRequest, getIncomingRequests, getOutgoingRequests } = require('../controllers/swapController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/swappable-slots', protect, getSwappableSlots);
router.post('/swap-request', protect, createSwapRequest);
router.post('/swap-response/:requestId', protect, respondToSwapRequest);
router.get('/swap-requests/incoming', protect, getIncomingRequests);
router.get('/swap-requests/outgoing', protect, getOutgoingRequests);

module.exports = router;
