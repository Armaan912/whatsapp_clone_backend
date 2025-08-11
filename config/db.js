import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log("MongoDB Connected Successfully");
    
    mongoose.connection.on('error', (err) => {
      console.error("MongoDB connection error:", err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log("MongoDB disconnected");
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log("MongoDB reconnected");
    });
    
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
};

export default connectDB;
