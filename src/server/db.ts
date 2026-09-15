import dns from "node:dns";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Resolve MongoDB Atlas SRV records reliably in local Node environments
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1", "1.0.0.1"]);
} catch {
  // Ignore in environments where setting DNS servers is restricted
}

let connectionPromise: Promise<typeof mongoose> | null = null;

export async function connectDB(): Promise<typeof mongoose | null> {
  if (mongoose.connection.readyState === 1) return mongoose;
  if (connectionPromise) return connectionPromise;

  const uri = process.env["MONGODB_URI"];
  if (!uri || !uri.trim()) {
    console.warn("[db] MONGODB_URI is not set.");
    return null;
  }

  connectionPromise = mongoose
    .connect(uri, {
      dbName: process.env["MONGODB_DB"] ?? "fieldservice",
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      socketTimeoutMS: 20000,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    })
    .then((m) => {
      console.log("[db] MongoDB connected successfully to database:", process.env["MONGODB_DB"] ?? "fieldservice");
      return m;
    })
    .catch((err) => {
      connectionPromise = null;
      console.error("[db] MongoDB connection error:", err.message);
      return null;
    });

  return connectionPromise;
}

export function isDbConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
