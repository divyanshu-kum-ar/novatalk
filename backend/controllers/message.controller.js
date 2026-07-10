import Message from "../models/message.model.js";
import Conversation from "./../models/conversation.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import { sanitizeUserProfile } from "./user.controller.js";

export const sendMessage = async (req, res) => {
  try {
    const { message, image, file, fileName, fileSize, replyTo, video, videoName, videoSize } = req.body;
    const { id: receiverId } = req.params; // receiverId can be user ID or group Conversation ID
    const senderId = req.user._id;

    // Validation for video if present
    if (video) {
      if (!videoName || !videoSize) {
        return res.status(400).json({ error: "Video name and size are required for video attachment" });
      }

      const allowedExtensions = ["mp4", "webm", "mov"];
      const extension = videoName.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        return res.status(400).json({ error: "Unsupported video type. Allowed: MP4, WEBM, MOV" });
      }

      if (videoSize > 100 * 1024 * 1024) {
        return res.status(400).json({ error: "Video size must be less than 100 MB" });
      }
    }

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
      // Block validation
      const sender = await User.findById(senderId).select("blockedUsers");
      const receiver = await User.findById(receiverId).select("blockedUsers");

      if (sender && (sender.blockedUsers || []).some(id => id.toString() === receiverId.toString())) {
        return res.status(400).json({ error: "You have blocked this user" });
      }
      if (receiver && (receiver.blockedUsers || []).some(id => id.toString() === senderId.toString())) {
        return res.status(400).json({ error: "You are blocked by this user" });
      }

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
      video: video || null,
      videoName: videoName || null,
      videoSize: videoSize || null,
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
        select: "message image file fileName fileSize video videoName videoSize senderId",
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
      
      const isBlocked = currentUser && (currentUser.blockedUsers || []).some(id => id.toString() === userToChatId.toString());
      const hasBlockedMe = otherUser && (otherUser.blockedUsers || []).some(id => id.toString() === senderId.toString());

      if (!isBlocked && !hasBlockedMe) {
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

export const forwardMessage = async (req, res) => {
  try {
    const { messageId, targetChatIds } = req.body;
    const senderId = req.user._id;

    if (!messageId || !targetChatIds || !Array.isArray(targetChatIds) || targetChatIds.length === 0) {
      return res.status(400).json({ error: "Invalid request payload" });
    }

    const sourceMessage = await Message.findById(messageId);
    if (!sourceMessage) {
      return res.status(404).json({ error: "Source message not found" });
    }

    const forwardedMessages = [];

    for (const targetId of targetChatIds) {
      // 1. Try to find if it is a Group conversation
      let conversation = await Conversation.findOne({
        _id: targetId,
        isGroup: true,
      });

      let isGroupChat = false;
      if (conversation) {
        isGroupChat = true;
        // Verify sender belongs to destination conversation
        const isParticipant = conversation.participants.some(
          (pId) => pId.toString() === senderId.toString()
        );
        if (!isParticipant) {
          continue;
        }
      } else {
        // Check if there is an existing 1-to-1 conversation by ID
        conversation = await Conversation.findOne({
          _id: targetId,
          isGroup: { $ne: true },
        });

        // If not found by conversation ID, check if targetId is another User ID
        if (!conversation) {
          const targetUser = await User.findById(targetId);
          if (targetUser) {
            // Find or create 1-to-1 conversation
            conversation = await Conversation.findOne({
              participants: { $all: [senderId, targetId] },
              isGroup: { $ne: true },
            });

            if (!conversation) {
              conversation = await Conversation.create({
                participants: [senderId, targetId],
              });
            }
          } else {
            continue;
          }
        } else {
          // Verify sender belongs to destination conversation
          const isParticipant = conversation.participants.some(
            (pId) => pId.toString() === senderId.toString()
          );
          if (!isParticipant) {
            continue;
          }
        }
      }

      // Determine receiverId for 1-to-1 chat
      let receiverId = null;
      if (!isGroupChat) {
        receiverId = conversation.participants.find(
          (pId) => pId.toString() !== senderId.toString()
        );
      }

      const receiverSocketId = isGroupChat ? null : (receiverId ? getReceiverSocketId(receiverId) : null);

      const newMsg = new Message({
        senderId,
        receiverId: isGroupChat ? null : receiverId,
        message: sourceMessage.message || "",
        image: sourceMessage.image || null,
        file: sourceMessage.file || null,
        fileName: sourceMessage.fileName || null,
        fileSize: sourceMessage.fileSize || null,
        replyTo: sourceMessage.replyTo || null,
        isForwarded: true,
        status: isGroupChat ? "sent" : (receiverSocketId ? "delivered" : "sent"),
      });

      conversation.messages.push(newMsg._id);
      await Promise.all([conversation.save(), newMsg.save()]);

      await newMsg.populate({
        path: "senderId",
        select: "username fullName profilePic gender"
      });

      if (newMsg.replyTo) {
        await newMsg.populate({
          path: "replyTo",
          select: "message image file fileName fileSize senderId",
          populate: {
            path: "senderId",
            select: "username fullName"
          }
        });
      }

      const messageResponse = newMsg.toObject();

      if (isGroupChat) {
        messageResponse.conversationId = conversation._id.toString();
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

      forwardedMessages.push(messageResponse);
    }

    res.status(201).json(forwardedMessages);
  } catch (error) {
    console.log("Error in forwardMessage controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const clearChat = async (req, res) => {
  try {
    const { id: conversationId } = req.params;
    const userId = req.user._id;

    // Find the conversation (can be group or 1-to-1)
    let conversation = await Conversation.findById(conversationId);
    
    // If not found by conversation ID, check if it's a 1-to-1 conversation with a specific User ID
    if (!conversation) {
      conversation = await Conversation.findOne({
        participants: { $all: [userId, conversationId] },
        isGroup: { $ne: true }
      });
    }

    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }

    // Verify participant
    const isParticipant = conversation.participants.some(
      (pId) => pId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Add user ID to deletedFor in all messages of this conversation
    await Message.updateMany(
      { _id: { $in: conversation.messages }, deletedFor: { $ne: userId } },
      { $push: { deletedFor: userId } }
    );

    res.status(200).json({ message: "Chat cleared successfully" });
  } catch (error) {
    console.log("Error in clearChat controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const previewCache = new Map();

const getMetaTag = (html, property) => {
  const regex = new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`, 'i');
  let match = html.match(regex);
  if (!match) {
    const altRegex = new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`, 'i');
    match = html.match(altRegex);
  }
  return match ? match[1] : null;
};

const getTitleTag = (html) => {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1] : null;
};

const getFavicon = (html, baseUrl) => {
  const match = html.match(/<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i) ||
                html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i);
  if (match) {
    let faviconUrl = match[1];
    if (!faviconUrl.startsWith("http")) {
      try {
        const urlObj = new URL(baseUrl);
        faviconUrl = new URL(faviconUrl, urlObj.origin).href;
      } catch (e) {}
    }
    return faviconUrl;
  }
  try {
    const urlObj = new URL(baseUrl);
    return `${urlObj.origin}/favicon.ico`;
  } catch (e) {
    return null;
  }
};

export const getLinkPreview = async (req, res) => {
  try {
    let { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: "URL query parameter is required" });
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    if (previewCache.has(url)) {
      return res.status(200).json(previewCache.get(url));
    }

    let origin = "";
    try {
      const parsed = new URL(url);
      origin = parsed.hostname;
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL status ${response.status}`);
    }

    const html = await response.text();

    const title = getMetaTag(html, "og:title") || getTitleTag(html) || origin;
    const description = getMetaTag(html, "og:description") || getMetaTag(html, "description") || "";
    const image = getMetaTag(html, "og:image") || "";
    const favicon = getFavicon(html, url);

    const previewData = {
      title,
      description,
      image,
      favicon,
      domain: origin,
      url,
    };

    previewCache.set(url, previewData);
    res.status(200).json(previewData);
  } catch (error) {
    console.log("Error in link preview controller:", error);
    res.status(200).json({ error: "Failed to generate preview" });
  }
};


