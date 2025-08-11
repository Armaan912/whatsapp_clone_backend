import mongoose from "mongoose";

const connectDB = async () => {
  console.log("🔍 Attempting to connect to MongoDB...");
  console.log("🔑 MONGO_URI:", process.env.MONGO_URI ? "Set" : "NOT SET");
  
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log("✅ MongoDB Connected Successfully");
    console.log("📊 Database:", mongoose.connection.db.databaseName);
    console.log("🔌 Connection State:", mongoose.connection.readyState);
    
    // Monitor connection events
    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB connection error:", err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log("⚠️ MongoDB disconnected");
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log("🔄 MongoDB reconnected");
    });
    
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    console.error("💀 Exiting process due to database connection failure");
    process.exit(1);
  }
};

export default connectDB;
