import Message from "../models/message.model.js";
import Conversation from "./../models/conversation.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { message, image, file, fileName, fileSize, replyTo } = req.body;
    const { id: receiverId } = req.params; // API endpoint se reciever ID aa jayegi.
    const senderId = req.user._id; // sender ID means the authenticated user. But authenticated user id is not present. So we will use middleware to check authenticated user using JWT and grab the sender id from there

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

    // First we will check whether the conversation between two above occured or not
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    // If not occured, we will create a new filed in conversation model and default message will be empty array
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const receiverSocketId = getReceiverSocketId(receiverId);

    // message is created
    const newMessage = new Message({
      senderId,
      receiverId,
      message: message || "",
      image: image || null,
      file: file || null,
      fileName: fileName || null,
      fileSize: fileSize || null,
      replyTo: replyTo || null,
      status: receiverSocketId ? "delivered" : "sent",
    });

    // we will push the message in conversation
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

    if (newMessage.replyTo) {
      await newMessage.populate({
        path: "replyTo",
        select: "message image file fileName fileSize senderId"
      });
    }

    if (receiverSocketId) {
      // io.to(<socket_id>).emit() used to send events to specific client
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).send(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate({
      path: "messages",
      populate: [
        {
          path: "replyTo",
          select: "message image file fileName fileSize senderId"
        },
        {
          path: "reactions.userId",
          select: "username fullName"
        }
      ]
    });

    if (!conversation) {
      return res.status(200).json([]);
    }

    await Message.updateMany(
      { senderId: userToChatId, receiverId: senderId, status: { $ne: "read" } },
      { $set: { status: "read" } }
    );

    const senderSocketId = getReceiverSocketId(userToChatId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("conversationRead", { readerId: senderId });
    }

    const messages = conversation.messages;
    res.status(200).json(messages);
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

    const receiverSocketId = getReceiverSocketId(msg.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageEdited", msg);
    }
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageEdited", msg);
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
    const senderId = req.user._id;

    const msg = await Message.findById(messageId);
    if (!msg) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (msg.senderId.toString() !== senderId.toString()) {
      return res.status(403).json({ error: "You can only delete your own messages" });
    }

    // Pull from conversation messages array
    await Conversation.updateOne(
      { participants: { $all: [msg.senderId, msg.receiverId] } },
      { $pull: { messages: messageId } }
    );

    // Delete message
    await Message.findByIdAndDelete(messageId);

    const receiverSocketId = getReceiverSocketId(msg.receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageDeleted", { messageId });
    }
    const senderSocketId = getReceiverSocketId(senderId);
    if (senderSocketId && senderSocketId !== receiverSocketId) {
      io.to(senderSocketId).emit("messageDeleted", { messageId });
    }

    res.status(200).json({ message: "Message deleted successfully" });
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

    res.status(200).json(msg.reactions);
  } catch (error) {
    console.log("Error in toggleReaction controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
