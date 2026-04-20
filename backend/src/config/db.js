import mongoose from "mongoose";

const connectDatabase = async () => {
  const connection = await mongoose.connect(process.env.MONGODB_URI);
  console.log(`MongoDB connected: ${connection.connection.host}`);
};

export default connectDatabase;

