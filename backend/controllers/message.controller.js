import Message from "../models/message.model.js";
import Conversation from "./../models/conversation.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { sanitizeUserProfile } from "./user.controller.js";

export const sendMessage = async (req, res) => {
  try {
    const { message, image, file, fileName, fileSize, replyTo } = req.body;
    const { id: receiverId } = req.params; // receiverId can be user ID or group Conversation ID
    const senderId = req.user._id;

    // Validation for files if present
    if (file) {
      if (!fileName || !fileSize) {
        return res.status(400).json({ error: "File name and size are required for file attachment" });
      }
      
      const allowedExtensions = ["pdf", "doc", "docx", "txt", "zip"];
      const extension = fileName.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        return res.status(400).json({ error: "Unsupported file type. Allowed: PDF, DOC, DOCX, TXT, ZIP" });
      }

      if (fileSize > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "File size must be less than 10 MB" });
      }
    }

    // Check if the receiverId corresponds to a group conversation
    let conversation = await Conversation.findOne({
      _id: receiverId,
      isGroup: true,
    });

    let isGroupChat = false;
    if (conversation) {
      isGroupChat = true;
    } else {
      // 1-to-1 conversation check/creation
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, receiverId] },
        isGroup: { $ne: true },
      });

      if (!conversation) {
        conversation = await Conversation.create({
          participants: [senderId, receiverId],
        });
      }
    }

    const receiverSocketId = isGroupChat ? null : getReceiverSocketId(receiverId);

    // message is created
    const newMessage = new Message({
      senderId,
      receiverId: isGroupChat ? null : receiverId,
      message: message || "",
      image: image || null,
      file: file || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      replyTo: replyTo || null,
      status: isGroupChat ? "sent" : (receiverSocketId ? "delivered" : "sent"),
    });

    // we will push the message in conversation
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    await newMessage.populate({
      path: "senderId",
      select: "username fullName profilePic gender"
    });

    if (newMessage.replyTo) {
      await newMessage.populate({
        path: "replyTo",
        select: "message image file fileName fileSize senderId",
        populate: {
          path: "senderId",
          select: "username fullName"
        }
      });
    }

    const messageResponse = newMessage.toObject();

    if (isGroupChat) {
      messageResponse.conversationId = conversation._id.toString();
      // Broadcast to all participants in the group except the sender
      conversation.participants.forEach((pId) => {
        if (pId.toString() !== senderId.toString()) {
          const pSocketId = getReceiverSocketId(pId);
          if (pSocketId) {
            io.to(pSocketId).emit("newMessage", messageResponse);
          }
        }
      });
    } else {
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("newMessage", messageResponse);
      }
    }

    res.status(201).send(messageResponse);
  } catch (error) {
    console.log("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    // Check if userToChatId is a group conversation ID
    let conversation = await Conversation.findOne({
      _id: userToChatId,
      isGroup: true,
    }).populate({
      path: "messages",
      match: { deletedFor: { $ne: senderId } },
      populate: [
        {
          path: "senderId",
          select: "username fullName profilePic gender about privacySettings"
        },
        {
          path: "replyTo",
          select: "message image file fileName fileSize senderId",
          populate: {
            path: "senderId",
            select: "username fullName"
          }
        },
        {
          path: "reactions.userId",
          select: "username fullName"
        }
      ]
    });

    if (!conversation) {
      // Fallback to 1-to-1 conversation
      conversation = await Conversation.findOne({
        participants: { $all: [senderId, userToChatId] },
        isGroup: { $ne: true },
      }).populate({
        path: "messages",
        match: { deletedFor: { $ne: senderId } },
        populate: [
          {
            path: "senderId",
            select: "username fullName profilePic gender about privacySettings"
          },
          {
            path: "replyTo",
            select: "message image file fileName fileSize senderId",
            populate: {
              path: "senderId",
              select: "username fullName"
            }
          },
          {
            path: "reactions.userId",
            select: "username fullName"
          }
        ]
      });
    }

    if (!conversation) {
      return res.status(200).json([]);
    }

    // Update status and emit events for 1-to-1 chats only
    if (!conversation.isGroup) {
      const otherUser = await User.findById(userToChatId);
      const currentUser = await User.findById(senderId);
      const otherReadReceipts = otherUser?.privacySettings?.readReceipts !== false;
      const currentReadReceipts = currentUser?.privacySettings?.readReceipts !== false;

      if (otherReadReceipts && currentReadReceipts) {
        await Message.updateMany(
          { senderId: userToChatId, receiverId: senderId, status: { $ne: "read" } },
          { $set: { status: "read" } }
        );

        const senderSocketId = getReceiverSocketId(userToChatId);
        if (senderSocketId) {
          io.to(senderSocketId).emit("conversationRead", { readerId: senderId });
        }
      }
    }

    const messages = conversation.messages;
    const sanitizedMessages = await Promise.all(messages.map(async (m) => {
      const mObj = m.toObject();
      if (mObj.senderId) {
        mObj.senderId = await sanitizeUserProfile(mObj.senderId, senderId);
      }
      return mObj;
    }));
    res.status(200).json(sanitizedMessages);
  } catch (error) {
    console.log("Error in getMessages controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const editMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { message } = req.body;
    const senderId = req.user._id;

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (msg.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ error: "You can only edit your own messages" });
    }

    msg.message = message;
    msg.edited = true;
    await msg.save();

    await msg.populate({
      path: "senderId",
      select: "username fullName profilePic gender"
    });

    const conversation = await Conversation.findOne({ messages: messageId });
    if (conversation && conversation.isGroup) {
      // Broadcast to all participants in the group
      conversation.participants.forEach((pId) => {
        const socketId = getReceiverSocketId(pId);
        if (socketId) {
          io.to(socketId).emit("messageEdited", msg);
        }
      });
    } else {
      const receiverSocketId = getReceiverSocketId(msg.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageEdited", msg);
      }
      const senderSocketId = getReceiverSocketId(senderId);
      if (senderSocketId && senderSocketId !== receiverSocketId) {
        io.to(senderSocketId).emit("messageEdited", msg);
      }
    }

    res.status(200).json(msg);
  } catch (error) {
    console.log("Error in editMessage controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { type } = req.body;
    const deleteType = type || req.query.type || "everyone";
    const senderId = req.user._id;

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (msg.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    const conversation = await Conversation.findOne({ messages: messageId });

    if (deleteType === "me") {
      if (!msg.deletedFor.includes(senderId)) {
        msg.deletedFor.push(senderId);
        await msg.save();
      }
      return res.status(200).json({ message: "Message deleted for me successfully", deleteType: "me" });
    } else {
      msg.message = "This message was deleted.";
      msg.image = null;
      msg.file = null;
      msg.fileName = null;
      msg.fileSize = null;
      msg.isDeletedForEveryone = true;
      msg.reactions = [];
      await msg.save();

      await msg.populate({
        path: "senderId",
        select: "username fullName profilePic gender"
      });

      if (msg.replyTo) {
        await msg.populate({
          path: "replyTo",
          select: "message image file fileName fileSize senderId",
          populate: {
            path: "senderId",
            select: "username fullName"
          }
        });
      }

      const messageResponse = msg.toObject();

      if (conversation) {
        if (conversation.isGroup) {
          conversation.participants.forEach((pId) => {
            const socketId = getReceiverSocketId(pId);
            if (socketId) {
              io.to(socketId).emit("messageDeletedForEveryone", messageResponse);
            }
          });
        } else {
          const receiverSocketId = getReceiverSocketId(msg.receiverId);
          if (receiverSocketId) {
            io.to(receiverSocketId).emit("messageDeletedForEveryone", messageResponse);
          }
          const senderSocketId = getReceiverSocketId(senderId);
          if (senderSocketId && senderSocketId !== receiverSocketId) {
            io.to(senderSocketId).emit("messageDeletedForEveryone", messageResponse);
          }
        }
      }

      return res.status(200).json(messageResponse);
    }
  } catch (error) {
    console.log("Error in deleteMessage controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const toggleReaction = async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user._id;

    if (!emoji) {
      return res.status(400).json({ error: "Emoji is required" });
    }

    // 1. Try to toggle off (if the user already has the exact same reaction)
    let msg = await Message.findOneAndUpdate(
      {
        _id: messageId,
        reactions: {
          $elemMatch: { userId, emoji }
        }
      },
      {
        $pull: { reactions: { userId } }
      },
      { new: true }
    );

    // 2. If not toggled off, try to update/replace existing reaction with the new emoji
    if (!msg) {
      msg = await Message.findOneAndUpdate(
        {
          _id: messageId,
          "reactions.userId": userId
        },
        {
          $set: { "reactions.$.emoji": emoji }
        },
        { new: true }
      );
    }

    // 3. If neither occurred, add the new reaction
    if (!msg) {
      msg = await Message.findOneAndUpdate(
        {
          _id: messageId
        },
        {
          $push: { reactions: { userId, emoji } }
        },
        { new: true }
      );
    }

    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    await msg.populate({
      path: "reactions.userId",
      select: "username fullName",
    });

    const conversation = await Conversation.findOne({ messages: messageId });
    if (conversation && conversation.isGroup) {
      conversation.participants.forEach((pId) => {
        const socketId = getReceiverSocketId(pId);
        if (socketId) {
          io.to(socketId).emit("messageReactionUpdate", {
            messageId: msg._id,
            reactions: msg.reactions,
          });
        }
      });
    } else {
      const receiverSocketId = getReceiverSocketId(msg.receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("messageReactionUpdate", {
          messageId: msg._id,
          reactions: msg.reactions,
        });
      }
      const senderSocketId = getReceiverSocketId(msg.senderId);
      if (senderSocketId && senderSocketId !== receiverSocketId) {
        io.to(senderSocketId).emit("messageReactionUpdate", {
          messageId: msg._id,
          reactions: msg.reactions,
        });
      }
    }

    res.status(200).json(msg.reactions);
  } catch (error) {
    console.log("Error in toggleReaction controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createCallLog = async (req, res) => {
  try {
    const { receiverId, type, duration, callType } = req.body;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
      isGroup: { $ne: true }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const receiverSocketId = getReceiverSocketId(receiverId);

    const isVideo = callType === "video";
    let messageText = "";
    if (type === "completed") {
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const durationStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
      messageText = isVideo ? `Video call ended (${durationStr})` : `Call ended (${durationStr})`;
    } else if (type === "rejected") {
      messageText = isVideo ? "Video call rejected" : "Call rejected";
    } else if (type === "missed") {
      messageText = isVideo ? "Missed video call" : "Missed call";
    } else if (type === "cancelled") {
      messageText = isVideo ? "Cancelled video call" : "Cancelled call";
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message: messageText,
      isCallLog: true,
      callLog: {
        type,
        duration,
        callType: callType || "voice",
      },
      status: receiverSocketId ? "delivered" : "sent",
    });

    conversation.messages.push(newMessage._id);
    await Promise.all([conversation.save(), newMessage.save()]);

    await newMessage.populate({
      path: "senderId",
      select: "username fullName profilePic gender"
    });

    const messageResponse = newMessage.toObject();

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageResponse);
    }

    res.status(201).json(messageResponse);
  } catch (error) {
    console.log("Error in createCallLog:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
