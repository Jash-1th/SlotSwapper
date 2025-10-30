# SlotSwapper Backend

Backend API for the SlotSwapper application built with Express.js and MongoDB.

## Project Structure

```
slotswapper-backend/
├── models/         # Mongoose models
├── controllers/    # Route controllers
├── routes/         # API routes
├── middleware/     # Custom middleware
├── server.js       # Main application file
├── package.json    # Dependencies
└── .env           # Environment variables
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Update the `.env` file with your MongoDB Atlas URI
   - Set your JWT secret key
   - Configure the PORT if needed

3. **Run the Application**
   ```bash
   # Development mode with nodemon
   npm run dev

   # Production mode
   npm start
   ```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT token generation

## API Endpoints

- `GET /` - API health check

## Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **dotenv** - Environment variable management
- **cors** - Cross-origin resource sharing
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
