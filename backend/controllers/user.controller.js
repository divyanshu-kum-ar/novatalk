import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

export const getUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const allUsers = await User.find({ _id: { $ne: loggedInUser } }).select(
      "-password"
    );

    const groups = await Conversation.find({
      isGroup: true,
      participants: loggedInUser,
    }).populate("participants", "-password");

    const userObj = await User.findById(loggedInUser);
    const pinnedChatIds = userObj ? (userObj.pinnedConversations || []) : [];
    const mutedChatIds = userObj ? (userObj.mutedConversations || []) : [];

    res.status(200).json({
      conversations: [...groups, ...allUsers],
      pinnedChatIds,
      mutedChatIds,
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
    const { fullName, profilePic } = req.body;
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (fullName) user.fullName = fullName;
    if (profilePic !== undefined) user.profilePic = profilePic;

    await user.save();

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
      gender: user.gender,
    });
  } catch (error) {
    console.log("Error in updateProfile controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
