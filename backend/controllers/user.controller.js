import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import bcrypt from "bcryptjs";

export const sanitizeUserProfile = async (targetUser, requestingUserId) => {
  if (!targetUser) return null;
  
  const sanitized = typeof targetUser.toObject === "function" ? targetUser.toObject() : { ...targetUser };
  const targetId = sanitized._id.toString();
  const requesterId = requestingUserId ? requestingUserId.toString() : null;
  
  if (targetId === requesterId) {
    return sanitized;
  }
  
  const privacy = sanitized.privacySettings || {
    lastSeen: "everyone",
    onlineStatus: "everyone",
    profilePhoto: "everyone",
    about: "everyone",
    readReceipts: true,
  };
  
  let isContact = false;
  if (requesterId) {
    const conversationExists = await Conversation.findOne({
      participants: { $all: [targetId, requesterId] },
      isGroup: false
    });
    isContact = !!conversationExists;
  }
  
  if (privacy.lastSeen === "nobody" || (privacy.lastSeen === "contacts" && !isContact)) {
    delete sanitized.lastSeen;
  }
  
  if (privacy.onlineStatus === "nobody" || (privacy.onlineStatus === "contacts" && !isContact)) {
    sanitized.hideOnline = true;
  }
  
  if (privacy.profilePhoto === "nobody" || (privacy.profilePhoto === "contacts" && !isContact)) {
    sanitized.profilePic = "";
  }
  
  if (privacy.about === "nobody" || (privacy.about === "contacts" && !isContact)) {
    sanitized.about = "";
  }
  
  return sanitized;
};

export const getUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const allUsers = await User.find({ _id: { $ne: loggedInUser } }).select(
      "-password"
    );
    const sanitizedUsers = await Promise.all(allUsers.map(u => sanitizeUserProfile(u, loggedInUser)));

    const groups = await Conversation.find({
      isGroup: true,
      participants: loggedInUser,
    }).populate("participants", "-password");

    const sanitizedGroups = await Promise.all(groups.map(async (group) => {
      const groupObj = group.toObject();
      groupObj.participants = await Promise.all(groupObj.participants.map(p => sanitizeUserProfile(p, loggedInUser)));
      return groupObj;
    }));

    const userObj = await User.findById(loggedInUser);
    const pinnedChatIds = userObj ? (userObj.pinnedConversations || []) : [];
    const mutedChatIds = userObj ? (userObj.mutedConversations || []) : [];
    const archivedChatIds = userObj ? (userObj.archivedConversations || []) : [];

    res.status(200).json({
      conversations: [...sanitizedGroups, ...sanitizedUsers],
      pinnedChatIds,
      mutedChatIds,
      archivedChatIds,
    });
  } catch (error) {
    console.log("Error in getUsers controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const toggleMuteChat = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.mutedConversations) {
      user.mutedConversations = [];
    }

    const index = user.mutedConversations.indexOf(chatId);
    if (index === -1) {
      user.mutedConversations.push(chatId);
    } else {
      user.mutedConversations.splice(index, 1);
    }

    await user.save();
    res.status(200).json(user.mutedConversations);
  } catch (error) {
    console.log("Error in toggleMuteChat controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const toggleArchiveChat = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.archivedConversations) {
      user.archivedConversations = [];
    }

    const index = user.archivedConversations.indexOf(chatId);
    if (index === -1) {
      user.archivedConversations.push(chatId);
    } else {
      user.archivedConversations.splice(index, 1);
    }

    await user.save();
    res.status(200).json(user.archivedConversations);
  } catch (error) {
    console.log("Error in toggleArchiveChat controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const togglePinChat = async (req, res) => {
  try {
    const { id: chatId } = req.params;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.pinnedConversations) {
      user.pinnedConversations = [];
    }

    const index = user.pinnedConversations.indexOf(chatId);
    if (index === -1) {
      user.pinnedConversations.push(chatId);
    } else {
      user.pinnedConversations.splice(index, 1);
    }

    await user.save();
    res.status(200).json(user.pinnedConversations);
  } catch (error) {
    console.log("Error in togglePinChat controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, profilePic, currentPassword, newPassword, about, privacySettings } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Please enter your current password" });
      }

      // Verify current password
      const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).json({ error: "Incorrect current password" });
      }

      // Validate new password rules:
      // Minimum 8 characters, at least one uppercase letter, one lowercase letter, one number
      if (newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters long" });
      }
      const hasUppercase = /[A-Z]/.test(newPassword);
      const hasLowercase = /[a-z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      if (!hasUppercase || !hasLowercase || !hasNumber) {
        return res.status(400).json({ error: "New password must contain at least one uppercase letter, one lowercase letter, and one number" });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    if (fullName !== undefined) {
      const trimmed = fullName.trim();
      if (!trimmed) {
        return res.status(400).json({ error: "Full Name cannot be empty" });
      }
      if (trimmed.length < 3) {
        return res.status(400).json({ error: "Full Name must be at least 3 characters long" });
      }
      if (trimmed.length > 30) {
        return res.status(400).json({ error: "Full Name must not exceed 30 characters" });
      }
      user.fullName = trimmed;
    }
    
    if (profilePic !== undefined) {
      if (profilePic !== "") {
        // Validate MIME type from base64 data URL
        const mimeMatch = profilePic.match(/^data:([^;]+);base64,/);
        if (!mimeMatch) {
          return res.status(400).json({ error: "Invalid image format" });
        }
        const mimeType = mimeMatch[1];
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
        if (!allowedTypes.includes(mimeType)) {
          return res.status(400).json({ error: "Please upload only JPG, JPEG, PNG, or WebP images" });
        }

        // Validate base64 size
        const base64Data = profilePic.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        if (buffer.length > 5 * 1024 * 1024) {
          return res.status(400).json({ error: "Image size must be less than 5MB" });
        }
      }
      user.profilePic = profilePic;
    }

    if (about !== undefined) {
      if (about.length > 150) {
        return res.status(400).json({ error: "About / Bio must not exceed 150 characters" });
      }
      user.about = about;
    }

    if (privacySettings !== undefined) {
      user.privacySettings = {
        ...user.privacySettings,
        ...privacySettings
      };
    }

    await user.save();

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
      gender: user.gender,
      about: user.about || "",
      privacySettings: user.privacySettings,
    });
  } catch (error) {
    console.log("Error in updateProfile controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id: userId } = req.params;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const sanitized = await sanitizeUserProfile(user, req.user._id);
    res.status(200).json(sanitized);
  } catch (error) {
    console.log("Error in getUserProfile controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 1. Delete all messages sent by this user
    await Message.deleteMany({ senderId: userId });

    // 2. Remove user from all conversations participants lists
    await Conversation.updateMany(
      { participants: userId },
      { $pull: { participants: userId } }
    );

    // 3. Clean up conversations with no participants left, or 1-on-1 chats that are now orphaned
    await Conversation.deleteMany({
      $or: [
        { participants: { $size: 0 } },
        { isGroup: false, participants: { $size: 1 } }
      ]
    });

    // 4. Delete the User record
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.log("Error in deleteProfile controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
