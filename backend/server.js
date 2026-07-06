import path from "path";
import fs from "fs";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes.js";
import messageRoutes from "./routes/message.routes.js";
import userRoutes from "./routes/user.routes.js";

import connectToMongoDB from "./db/connectToMongoDB.js";
import { app, server } from "./socket/socket.js";

const PORT = process.env.PORT || 5000;

const __dirname = path.resolve();
const frontendDistPath = fs.existsSync(path.join(__dirname, "/frontend/dist"))
  ? path.join(__dirname, "/frontend/dist")
  : path.join(__dirname, "../frontend/dist");

dotenv.config();

app.use(express.json({ limit: "20mb" }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);

app.use(express.static(frontendDistPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendDistPath, "index.html"));
});

// Error handling middleware to ensure we always return valid JSON on errors
app.use((err, req, res, next) => {
  if (err) {
    res.status(err.status || 500).json({ error: err.message || "Something went wrong" });
  } else {
    next();
  }
});

server.listen(PORT, () => {
  connectToMongoDB();
  console.log(`Server is running on PORT ${PORT}`);
});
