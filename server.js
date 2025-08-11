import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import jwt from "jsonwebtoken";

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { 
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
  }
});

const userSockets = new Map();
const socketUsers = new Map();

const getUserSocket = (userId) => userSockets.get(userId);
const isUserOnline = (userId) => userSockets.has(userId);

const disconnectAllUserSessions = (userId) => {
  const socketId = userSockets.get(userId);
  if (socketId) {
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect(true);
    }
    userSockets.delete(userId);
    socketUsers.delete(socketId);
  }
};

const cleanupStaleConnections = async () => {
  try {
    const User = (await import("./models/user.model.js")).default;
    const currentTime = new Date();
    const staleThreshold = 10 * 60 * 1000;
    
    const onlineUsers = await User.find({ isOnline: true });
    
    for (const user of onlineUsers) {
      const userId = user._id.toString();
      const lastSeen = user.lastSeen;
      const timeSinceLastSeen = currentTime - lastSeen;
      const hasActiveSocket = userSockets.has(userId);
      
      if (timeSinceLastSeen > staleThreshold) {
        if (!hasActiveSocket) {
          await User.findByIdAndUpdate(userId, { 
            isOnline: false,
            lastSeen: lastSeen
          });
          
          io.emit("user_status_change", {
            userId: userId,
            isOnline: false,
            lastSeen: lastSeen
          });
        }
      }
    }
  } catch (error) {
  }
};

setInterval(cleanupStaleConnections, 5 * 60 * 1000);

io.on("connection", (socket) => {
  socket.on("user_authenticated", async (token) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      
      if (userSockets.has(userId)) {
        disconnectAllUserSessions(userId);
      }
      
      userSockets.set(userId, socket.id);
      socketUsers.set(socket.id, userId);
      
      const User = (await import("./models/user.model.js")).default;
      await User.findByIdAndUpdate(userId, { 
        isOnline: true,
        lastSeen: new Date()
      }, { new: true });
      
      io.emit("user_status_change", {
        userId: userId,
        isOnline: true,
        lastSeen: new Date()
      });
      
      const Conversation = (await import("./models/conversation.model.js")).default;
      const userConversations = await Conversation.find({ participants: userId });
      userConversations.forEach(conv => {
        socket.join(conv._id.toString());
      });
      
    } catch (error) {
      socket.emit("auth_error", { message: "Authentication failed" });
    }
  });

  socket.on("user_logout", async (data) => {
    const userId = data.userId;
    
    if (userId) {
      try {
        const User = (await import("./models/user.model.js")).default;
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date()
        });
        
        io.emit("user_status_change", {
          userId: userId,
          isOnline: false,
          lastSeen: new Date()
        });
        
        disconnectAllUserSessions(userId);
      } catch (error) {
      }
    }
  });

  socket.on("force_user_logout", (data) => {
    const { userId } = data;
    if (socketUsers.get(socket.id) === userId) {
      socket.disconnect(true);
    }
  });

  socket.on("heartbeat", async () => {
    try {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        const User = (await import("./models/user.model.js")).default;
        await User.findByIdAndUpdate(userId, { 
          lastSeen: new Date()
        });
      }
    } catch (error) {
    }
  });

  socket.on("join_room", async (data) => {
    const { roomId, userId } = data;
    socket.join(roomId);
  });

  socket.on("leave_room", (roomId) => {
    socket.leave(roomId);
  });

  socket.on("send_message", (data) => {
    if (data.conversationId) {
      io.to(data.conversationId).emit("receive_message", data);
    }
  });

  socket.on("typing_start", (data) => {
    socket.to(data.conversationId).emit("user_typing", {
      userId: data.userId,
      username: data.username
    });
  });

  socket.on("typing_stop", (data) => {
    socket.to(data.conversationId).emit("user_stopped_typing", {
      userId: data.userId
    });
  });

  socket.on("message_received", async (data) => {
    try {
      const { messageId, conversationId, receiverId } = data;
      
      const Message = (await import("./models/message.model.js")).default;
      const updateResult = await Message.findByIdAndUpdate(
        messageId,
        { status: "delivered" },
        { new: true }
      );
      
      if (updateResult) {
        io.to(conversationId).emit("message_status_update", {
          messageId: messageId,
          status: "delivered",
          conversationId: conversationId
        });
        
        if (updateResult.senderId) {
          io.to(updateResult.senderId).emit("message_status_update", {
            messageId: messageId,
            status: "delivered",
            conversationId: conversationId
          });
        }
      }
    } catch (error) {
    }
  });

  socket.on("mark_messages_read", async (data) => {
    try {
      const { conversationId, userId } = data;
      
      const Message = (await import("./models/message.model.js")).default;
      await Message.updateMany(
        { 
          conversationId: conversationId, 
          receiverId: userId,
          status: { $in: ["pending", "sent", "delivered"] }
        },
        { status: "read" }
      );
      
      io.to(conversationId).emit("messages_marked_read", {
        conversationId,
        userId,
        timestamp: new Date()
      });
      
      const updatedMessages = await Message.find({
        conversationId: conversationId,
        receiverId: userId,
        status: "read"
      });
      
      updatedMessages.forEach(msg => {
        io.to(conversationId).emit("message_status_update", {
          messageId: msg._id,
          status: "read",
          conversationId: conversationId
        });
        
        if (msg.senderId) {
          io.to(msg.senderId.toString()).emit("message_status_update", {
            messageId: msg._id,
            status: "read",
            conversationId: conversationId
          });
        }
      });
      
    } catch (error) {
    }
  });

  socket.on("disconnect", async () => {
    try {
      const userId = socketUsers.get(socket.id);
      if (userId) {
        const User = (await import("./models/user.model.js")).default;
        await User.findByIdAndUpdate(userId, { 
          isOnline: false,
          lastSeen: new Date()
        }, { new: true });
        
        io.emit("user_status_change", {
          userId: userId,
          isOnline: false,
          lastSeen: new Date()
        });
        
        userSockets.delete(userId);
        socketUsers.delete(socket.id);
      }
    } catch (error) {
    }
  });
});

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  req.io = io;
  req.getUserSocket = getUserSocket;
  req.isUserOnline = isUserOnline;
  next();
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  process.exit(1);
});
