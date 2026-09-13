import mongoose from "mongoose";

const connectDb = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.warn("[Evaluation Service] Warning: MONGO_URI or MONGODB_URI is not defined in environment variables.");
    return;
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Evaluation Service] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[Evaluation Service] MongoDB connection error: ${error.message}`);
  }
};

export default connectDb;
