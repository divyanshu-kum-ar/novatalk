import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST"],
  },
});

const userSocketMap = {}; // {userId: socketId}

export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const markSentMessagesAsDelivered = async (receiverId) => {
  try {
    const sentMessages = await Message.find({ receiverId, status: "sent" });
    if (sentMessages.length > 0) {
      await Message.updateMany({ receiverId, status: "sent" }, { $set: { status: "delivered" } });
      
      const senders = [...new Set(sentMessages.map(m => m.senderId.toString()))];
      senders.forEach(senderId => {
        const senderSocketId = getReceiverSocketId(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("messagesDelivered", { receiverId });
        }
      });
    }
  } catch (error) {
    console.log("Error marking messages as delivered:", error);
  }
};

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  // support both query (older clients) and auth (recommended)
  const userId = socket.handshake?.query?.userId || socket.handshake?.auth?.userId;
  if (userId && userId !== "undefined") {
    userSocketMap[userId] = socket.id;
    markSentMessagesAsDelivered(userId);
  }

  // notify online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Voice Call Signaling
  socket.on("voice-call", ({ userToCall, callerName, callerAvatar }) => {
    const receiverSocketId = getReceiverSocketId(userToCall);
    console.log("[SERVER] voice-call event:", {
      callerId: userId,
      receiverId: userToCall,
      senderSocketId: socket.id,
      receiverSocketId,
    });
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("voice-call", {
        from: userId,
        callerName,
        callerAvatar,
      });
      console.log("[SERVER] emitted voice-call to receiver:", receiverSocketId);
    } else {
      socket.emit("call-rejected", { reason: "User is offline" });
      console.log("[SERVER] call-rejected: User is offline");
    }
  });

  socket.on("accept-call", ({ to }) => {
    const callerSocketId = getReceiverSocketId(to);
    console.log("[SERVER] accept-call event from:", userId, "to:", to, "callerSocketId:", callerSocketId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("accept-call", { from: userId });
    }
  });

  socket.on("reject-call", ({ to }) => {
    const callerSocketId = getReceiverSocketId(to);
    console.log("[SERVER] reject-call event from:", userId, "to:", to, "callerSocketId:", callerSocketId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("reject-call", { from: userId });
    }
  });

  socket.on("webrtc-offer", ({ to, offer }) => {
    const receiverSocketId = getReceiverSocketId(to);
    console.log("[SERVER] webrtc-offer from:", userId, "to:", to, "receiverSocketId:", receiverSocketId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("webrtc-offer", { offer, from: userId });
    }
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    const callerSocketId = getReceiverSocketId(to);
    console.log("[SERVER] webrtc-answer from:", userId, "to:", to, "callerSocketId:", callerSocketId);
    if (callerSocketId) {
      io.to(callerSocketId).emit("webrtc-answer", { answer, from: userId });
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const partnerSocketId = getReceiverSocketId(to);
    console.log("[SERVER] ice-candidate from:", userId, "to:", to, "partnerSocketId:", partnerSocketId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("ice-candidate", { candidate, from: userId });
    }
  });

  socket.on("end-call", ({ to }) => {
    const partnerSocketId = getReceiverSocketId(to);
    console.log("[SERVER] end-call from:", userId, "to:", to, "partnerSocketId:", partnerSocketId);
    if (partnerSocketId) {
      io.to(partnerSocketId).emit("end-call", { from: userId });
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    console.log(`typing event received: senderId=${senderId}, receiverId=${receiverId}`);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("stopTyping", ({ senderId, receiverId }) => {
    console.log(`stopTyping event received: senderId=${senderId}, receiverId=${receiverId}`);
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("stopTyping", { senderId });
    }
  });

  socket.on("messageDelivered", async ({ messageId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { status: "delivered" });
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdate", { messageId, status: "delivered" });
      }
    } catch (e) {
      console.log(e);
    }
  });

  socket.on("messageRead", async ({ messageId, senderId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { status: "read" });
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messageStatusUpdate", { messageId, status: "read" });
      }
    } catch (e) {
      console.log(e);
    }
  });

  // socket.on() is used to listen to the events. can be used both on client and server side
  socket.on("disconnect", async () => {
    console.log("user disconnected", socket.id);
    if (userId && userId !== "undefined") {
      delete userSocketMap[userId];
      const lastSeenTime = new Date();
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: lastSeenTime });
        io.emit("userOffline", { userId, lastSeen: lastSeenTime });
      } catch (error) {
        console.log("Error updating lastSeen on disconnect:", error);
      }
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { app, io, server };
