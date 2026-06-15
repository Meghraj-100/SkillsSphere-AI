import mongoose from "mongoose";
import User from "./src/database/models/User.js";
import { findOrCreateGoogleUser } from "./src/modules/auth/service.js";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/skillssphere");
  try {
    const user = await findOrCreateGoogleUser({
      email: "test.google@example.com",
      name: "Test Google User",
      picture: "http://example.com/pic.jpg"
    });
    console.log("User created:", user);
  } catch (err) {
    console.error("Error creating google user:", err);
  }
  process.exit(0);
}
run();
