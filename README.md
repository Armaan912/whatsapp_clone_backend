# WhatsApp Web Clone - Backend

A real-time messaging backend built with Node.js, Express, Socket.IO, and MongoDB for the WhatsApp Web Clone application.

## 🚀 Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.IO** - Real-time communication
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables management

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js              # MongoDB connection configuration
├── controllers/
│   ├── authController.js   # Authentication logic
│   ├── conversationController.js # Conversation management logic
│   ├── messageController.js # Message handling logic
│   └── userController.js   # User management logic
├── middlewares/
│   ├── authMiddleware.js   # JWT authentication middleware
│   ├── uploadMiddleware.js # File upload middleware
│   └── validationMiddleware.js # Request validation
├── models/
│   ├── conversation.model.js # Conversation data model
│   ├── message.model.js     # Message data model
│   └── user.model.js        # User data model
├── routes/
│   ├── authRoutes.js       # Authentication routes
│   ├── conversationRoutes.js # Conversation management routes
│   ├── messageRoutes.js     # Message handling routes
│   └── userRoutes.js        # User management routes
├── uploads/
│   └── profile-photos/      # Profile image uploads
├── services/                # Business logic services
├── utils/                   # Utility functions
├── server.js                # Main server file
└── package.json             # Dependencies and scripts
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- npm or yarn

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/whatsapp-clone
   JWT_SECRET=your_super_secret_jwt_key_here
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod
   # Or
   sudo systemctl start mongod
   ```

4. **Start the Server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev

   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`

## 📡 API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/register` | Register new user | `{ name, email, password }` |
| `POST` | `/login` | Login user | `{ email, password }` |
| `POST` | `/logout` | Logout user | - |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Headers | Body |
|--------|----------|-------------|---------|------|
| `GET` | `/` | Get all users | `Authorization: Bearer <token>` | - |
| `GET` | `/:id` | Get user by ID | `Authorization: Bearer <token>` | - |
| `PUT` | `/:id` | Update user | `Authorization: Bearer <token>` | `{ name, bio, profileImage }` |

### Conversation Routes (`/api/conversations`)

| Method | Endpoint | Description | Headers | Body |
|--------|----------|-------------|---------|------|
| `GET` | `/` | Get user conversations | `Authorization: Bearer <token>` | - |
| `POST` | `/` | Create new conversation | `Authorization: Bearer <token>` | `{ participantId }` |
| `GET` | `/:id` | Get conversation by ID | `Authorization: Bearer <token>` | - |

### Message Routes (`/api/messages`)

| Method | Endpoint | Description | Headers | Body |
|--------|----------|-------------|---------|------|
| `GET` | `/:conversationId` | Get conversation messages | `Authorization: Bearer <token>` | - |
| `POST` | `/` | Send new message | `Authorization: Bearer <token>` | `{ content, conversationId }` |

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Register/Login**: Get a JWT token
2. **Protected Routes**: Include token in Authorization header
3. **Token Format**: `Authorization: Bearer <your_jwt_token>`

## 📁 File Upload

The API supports file uploads for:
- **Profile Images**: User profile pictures

### Upload Configuration
- **Storage**: Local file system (`uploads/profile-photos/` directory)
- **File Types**: Images (jpg, jpeg, png, gif)
- **Size Limit**: 5MB per file
- **Naming**: Timestamp-based unique names

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  bio: String,
  profileImage: String,
  isOnline: Boolean,
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Conversation Model
```javascript
{
  participants: [ObjectId (ref: User)],
  lastMessage: ObjectId (ref: Message),
  createdAt: Date,
  updatedAt: Date
}
```

### Message Model
```javascript
{
  content: String,
  sender: ObjectId (ref: User),
  conversation: ObjectId (ref: Conversation),
  isRead: Boolean,
  createdAt: Date
}
```

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | 5000 | No |
| `MONGO_URI` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | Secret key for JWT tokens | - | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | - | Yes |

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set strong JWT secret
4. Run: `npm start`

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Features

- **Password Hashing**: bcryptjs for secure password storage
- **JWT Authentication**: Stateless authentication
- **CORS Protection**: Configured for frontend domain
- **Input Validation**: Request body validation
- **File Upload Security**: Type and size restrictions

## 📊 Monitoring

The API includes basic logging for:
- Request/response logging
- Error tracking
- Database connection status
- Socket.IO connection events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
