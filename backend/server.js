const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('cors');
const User = require('./models/userModel');
const authRoutes = require('./routes/authRoutes');
const eventRoutes = require('./routes/eventRoutes');
const swapRoutes = require('./routes/swapRoutes');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL, // Should be 'https://slot-swapper.netlify.app'
  'http://localhost:5173'  // For local testing
];

const corsOptions = {
  origin: function (origin, callback) {
    // Check if the incoming origin is in our whitelist
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      // Allow the request
      callback(null, true);
    } else {
      // Block the request
      console.error(`CORS Blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies/headers
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with the same CORS configuration
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach the user to the socket
    socket.user = user;
    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user._id}`);
  
  // Join user's personal room for private messages
  socket.join(socket.user._id.toString());
  
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user._id}`);
  });

  // Handle any custom events here
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
});

// Middleware
app.use(express.json());

// Handle preflight requests
app.options('*', cors(corsOptions));

// MongoDB Connection Function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected Successfully');
  } catch (error) {
    console.error('MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Connect to Database
connectDB();

// Make io accessible to routes
app.set('io', io);

// Middleware to make io available in request objects
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Simple test route
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', swapRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
