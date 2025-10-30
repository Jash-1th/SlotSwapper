# SlotSwapper

A full-stack web application that allows users to manage their time slots and swap them with other users. Users can create events, mark them as swappable, browse available slots from others, and send/receive swap requests.

## Project Overview

SlotSwapper is designed to help users efficiently manage and exchange time slots. The application provides a marketplace where users can view available slots from other users and request swaps. The swap system includes a pending state to ensure both parties agree before the exchange is finalized.

## Tech Stack

### Backend
- **Node.js** with **Express.js** - RESTful API server
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **JWT (jsonwebtoken)** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management

## Features

- User authentication (register/login with JWT)
- Create, read, update, and delete events
- Mark events as BUSY, SWAPPABLE, or SWAP_PENDING
- Browse marketplace of swappable slots from other users
- Send swap requests to other users
- Accept or reject incoming swap requests
- View outgoing and incoming swap requests
- Protected routes requiring authentication
- Automatic token management with axios interceptors

## Local Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn package manager

### 1. Clone the Repository

```bash
git clone <repository-url>
cd SlotSwapper
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/slotswapper?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
```

Start the backend server:

```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal window:

```bash
cd frontend
npm install
```

Start the frontend development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Access the Application

Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Authentication Routes

| Method | Path | Description | Protected |
|--------|------|-------------|-----------|
| POST | `/api/auth/register` | Register a new user | No |
| POST | `/api/auth/login` | Login user and get JWT token | No |

### Event Routes

| Method | Path | Description | Protected |
|--------|------|-------------|-----------|
| POST | `/api/events` | Create a new event | Yes |
| GET | `/api/events/my-events` | Get all events for logged-in user | Yes |
| PUT | `/api/events/:id` | Update an event (title, times, status) | Yes |
| DELETE | `/api/events/:id` | Delete an event | Yes |

### Swap Routes

| Method | Path | Description | Protected |
|--------|------|-------------|-----------|
| GET | `/api/swappable-slots` | Get all swappable slots from other users | Yes |
| POST | `/api/swap-request` | Create a swap request | Yes |
| POST | `/api/swap-response/:requestId` | Accept or reject a swap request | Yes |
| GET | `/api/swap-requests/incoming` | Get incoming swap requests | Yes |
| GET | `/api/swap-requests/outgoing` | Get outgoing swap requests | Yes |

## API Request/Response Examples

### Register User
```json
POST /api/auth/register
Body: {
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}

Response: {
  "_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "token": "jwt_token_here"
}
```

### Create Event
```json
POST /api/events
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "title": "Team Meeting",
  "startTime": "2024-01-15T10:00:00Z",
  "endTime": "2024-01-15T11:00:00Z"
}
```

### Create Swap Request
```json
POST /api/swap-request
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "mySlotId": "event_id_1",
  "theirSlotId": "event_id_2"
}
```

### Respond to Swap Request
```json
POST /api/swap-response/:requestId
Headers: { "Authorization": "Bearer <token>" }
Body: {
  "acceptance": true
}
```

## Project Structure

```
SlotSwapper/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   └── swapController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── userModel.js
│   │   ├── eventModel.js
│   │   └── swapRequestModel.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── swapRoutes.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Modal.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── SignUp.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Marketplace.jsx
│   │   │   └── Requests.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
└── README.md
```

## Database Models

### User
- name: String (required)
- email: String (required, unique)
- password: String (required, hashed)
- timestamps: createdAt, updatedAt

### Event
- owner: ObjectId (ref: User)
- title: String (required)
- startTime: Date (required)
- endTime: Date (required)
- status: Enum ['BUSY', 'SWAPPABLE', 'SWAP_PENDING']
- timestamps: createdAt, updatedAt

### SwapRequest
- requester: ObjectId (ref: User)
- receiver: ObjectId (ref: User)
- offeredSlot: ObjectId (ref: Event)
- requestedSlot: ObjectId (ref: Event)
- status: Enum ['PENDING', 'ACCEPTED', 'REJECTED']
- timestamps: createdAt, updatedAt

## Key Features Implementation

### Authentication Flow
1. User registers/logs in
2. Backend returns JWT token
3. Token stored in localStorage
4. Axios interceptor adds token to all requests
5. Protected routes check authentication status

### Swap Flow
1. User marks event as SWAPPABLE
2. Event appears in marketplace for other users
3. Another user selects the event and offers their own SWAPPABLE event
4. Swap request created with status PENDING
5. Both events marked as SWAP_PENDING
6. Original owner accepts/rejects request
7. If accepted: owners swapped, events set to BUSY
8. If rejected: both events set back to SWAPPABLE

### Transaction Safety
- Swap acceptance uses MongoDB transactions
- Ensures atomic updates to prevent data inconsistency
- Rollback on any error during swap process

## Development Notes

- Backend runs on port 5000 by default
- Frontend runs on port 5173 by default
- CORS enabled for cross-origin requests
- Password minimum length: 6 characters
- JWT tokens expire after 30 days
- All protected routes require valid JWT token

## Future Enhancements

- Email notifications for swap requests
- Calendar integration
- Advanced filtering and search in marketplace
- User profiles and ratings
- Swap history tracking
- Mobile responsive design improvements
- Real-time notifications with WebSockets

## License

This project is open source and available under the MIT License.
