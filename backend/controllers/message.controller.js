import Message from "../models/message.model.js";
import Conversation from "./../models/conversation.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { message, image, file, fileName, fileSize } = req.body;
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
      status: receiverSocketId ? "delivered" : "sent",
    });

    // we will push the message in conversation
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    await Promise.all([conversation.save(), newMessage.save()]);

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
    }).populate("messages"); // these are actual messages given one by one as populate is used

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
