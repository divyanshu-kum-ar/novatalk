import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const globalSearch = async (req, res) => {
  try {
    const query = req.query.q || "";
    const loggedInUserId = req.user._id;

    if (!query.trim()) {
      return res.status(200).json({
        users: [],
        groups: [],
        conversations: [],
        messages: [],
      });
    }

    const regex = new RegExp(query, "i");

    // 1. Search Users (excluding logged-in user and blocked users)
    const userDoc = await User.findById(loggedInUserId);
    const blockedUsers = userDoc?.blockedUsers || [];
    const usersWhoBlockedMe = await User.find({ blockedUsers: loggedInUserId }).select("_id");
    const blockedIds = [...blockedUsers, ...usersWhoBlockedMe.map((u) => u._id)];

    const users = await User.find({
      _id: { $ne: loggedInUserId, $nin: blockedIds },
      $or: [
        { fullName: { $regex: regex } },
        { username: { $regex: regex } },
      ],
    })
      .select("-password")
      .limit(20);

    // 2. Search Groups (where participant and matches groupName)
    const groups = await Conversation.find({
      isGroup: true,
      participants: loggedInUserId,
      groupName: { $regex: regex },
    })
      .populate("participants", "-password")
      .limit(20);

    // 3. Search Conversations (where participant and other participant matches name)
    const privateConvs = await Conversation.find({
      isGroup: false,
      participants: loggedInUserId,
    }).populate("participants", "-password");

    const conversations = privateConvs
      .filter((conv) => {
        const otherParticipant = conv.participants.find(
          (p) => p._id.toString() !== loggedInUserId.toString()
        );
        if (!otherParticipant) return false;
        const isBlocked = blockedIds.some(
          (bId) => bId.toString() === otherParticipant._id.toString()
        );
        if (isBlocked) return false;
        return (
          otherParticipant.fullName.match(regex) ||
          otherParticipant.username.match(regex)
        );
      })
      .slice(0, 20);

    // 4. Search Messages (in user's conversations, excluding system messages)
    const myConvs = await Conversation.find({ participants: loggedInUserId }).select("_id");
    const myConvIds = myConvs.map((c) => c._id);

    const messages = await Message.find({
      conversationId: { $in: myConvIds },
      message: { $regex: regex },
      isSystem: { $ne: true },
    })
      .populate("senderId", "fullName profilePic username gender")
      .sort({ createdAt: -1 })
      .limit(20);

    const formattedMessages = await Promise.all(
      messages.map(async (msg) => {
        const conv = await Conversation.findById(msg.conversationId).populate(
          "participants",
          "fullName"
        );
        let conversationName = "";
        if (conv) {
          if (conv.isGroup) {
            conversationName = conv.groupName;
          } else {
            const other = conv.participants.find(
              (p) => p._id.toString() !== loggedInUserId.toString()
            );
            conversationName = other ? other.fullName : "Private Chat";
          }
        }
        return {
          _id: msg._id,
          message: msg.message,
          createdAt: msg.createdAt,
          conversationId: msg.conversationId,
          sender: {
            fullName: msg.senderId?.fullName || "User",
            profilePic: msg.senderId?.profilePic || "",
            username: msg.senderId?.username || "",
            gender: msg.senderId?.gender || "male",
          },
          conversationName,
        };
      })
    );

    res.status(200).json({
      users,
      groups,
      conversations,
      messages: formattedMessages,
    });
  } catch (error) {
    console.log("Error in globalSearch controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
