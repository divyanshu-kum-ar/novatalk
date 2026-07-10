import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";

export const createGroup = async (req, res) => {
  try {
    const { groupName, groupAvatar, participants } = req.body;
    const creatorId = req.user._id;

    if (!groupName) {
      return res.status(400).json({ error: "Group name is required" });
    }

    // Participants should include the creator
    let groupParticipants = [creatorId];
    if (Array.isArray(participants)) {
      participants.forEach((pId) => {
        if (pId && !groupParticipants.includes(pId)) {
          groupParticipants.push(pId);
        }
      });
    }

    const newGroup = new Conversation({
      participants: groupParticipants,
      isGroup: true,
      groupName,
      groupAvatar: groupAvatar || "",
      groupCreator: creatorId,
      messages: [],
    });

    await newGroup.save();

    const populatedGroup = await Conversation.findById(newGroup._id).populate(
      "participants",
      "-password"
    );

    res.status(201).json(populatedGroup);
  } catch (error) {
    console.log("Error in createGroup controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const { groupName, groupAvatar, participants } = req.body;
    const userId = req.user._id;

    const group = await Conversation.findById(id);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.groupCreator.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the group creator can update this group" });
    }

    const oldGroup = await Conversation.findById(id);
    const oldParticipants = oldGroup ? oldGroup.participants.map(pId => pId.toString()) : [];

    if (groupName !== undefined) {
      group.groupName = groupName;
    }

    if (groupAvatar !== undefined) {
      group.groupAvatar = groupAvatar;
    }

    if (Array.isArray(participants)) {
      // Ensure the creator is always a participant
      let updatedParticipants = [group.groupCreator.toString()];
      participants.forEach((pId) => {
        const idStr = pId.toString();
        if (pId && !updatedParticipants.includes(idStr)) {
          updatedParticipants.push(idStr);
        }
      });
      group.participants = updatedParticipants;
    }

    await group.save();

    const populatedGroup = await Conversation.findById(group._id).populate(
      "participants",
      "-password"
    );

    // Emit groupUpdated socket event to all old and new participants
    const targets = Array.from(new Set([...oldParticipants, ...populatedGroup.participants.map(p => p._id.toString())]));
    targets.forEach((pId) => {
      const socketId = getReceiverSocketId(pId);
      if (socketId) {
        io.to(socketId).emit("groupUpdated", populatedGroup);
      }
    });

    res.status(200).json(populatedGroup);
  } catch (error) {
    console.log("Error in updateGroup controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const leaveGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    const isMember = group.participants.some((id) => id.toString() === userId.toString());
    if (!isMember) {
      return res.status(400).json({ error: "You are not a member of this group" });
    }

    const leavingUser = await User.findById(userId);
    const leavingUserFullName = leavingUser ? leavingUser.fullName : "A member";

    // Filter out the leaving user
    group.participants = group.participants.filter(
      (id) => id.toString() !== userId.toString()
    );

    let systemText = "";
    let newCreator = null;
    let groupDeleted = false;

    if (group.groupCreator.toString() === userId.toString()) {
      // Creator is leaving
      if (group.participants.length > 0) {
        // Transfer admin to the first (oldest) remaining participant
        newCreator = group.participants[0];
        group.groupCreator = newCreator;
        const newAdminUser = await User.findById(newCreator);
        const newAdminName = newAdminUser ? newAdminUser.fullName : "Another member";
        systemText = `${leavingUserFullName} left the group. ${newAdminName} is now the group admin.`;
      } else {
        // No members left, delete the group and its messages
        groupDeleted = true;
        await Message.deleteMany({ _id: { $in: group.messages } });
        await Conversation.findByIdAndDelete(groupId);
        systemText = "Group deleted.";
      }
    } else {
      // Normal member leaving
      systemText = `${leavingUserFullName} left the group.`;
    }

    let savedGroup = null;
    let systemMessageObj = null;

    if (!groupDeleted) {
      await group.save();

      // Create and save the system message
      const systemMessage = new Message({
        senderId: userId,
        message: systemText,
        isSystem: true,
      });
      await systemMessage.save();

      group.messages.push(systemMessage._id);
      await group.save();

      // Populate participants for response and broadcasts
      savedGroup = await Conversation.findById(groupId)
        .populate("participants", "-password")
        .populate({
          path: "messages",
          populate: {
            path: "senderId",
            select: "-password",
          },
        });

      systemMessageObj = await Message.findById(systemMessage._id).populate("senderId", "-password");
    }

    // Emit Socket.IO event to remaining members
    const targets = groupDeleted ? group.participants : group.participants.concat(userId);
    targets.forEach((pId) => {
      const socketId = getReceiverSocketId(pId);
      if (socketId) {
        io.to(socketId).emit("groupLeft", {
          groupId,
          leftUserId: userId.toString(),
          systemMessage: systemMessageObj,
          group: savedGroup,
          groupDeleted,
        });
      }
    });

    res.status(200).json({
      message: groupDeleted ? "Group deleted successfully" : "Left group successfully",
      groupDeleted,
      group: savedGroup,
    });
  } catch (error) {
    console.log("Error in leaveGroup controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    const group = await Conversation.findById(groupId);
    if (!group || !group.isGroup) {
      return res.status(404).json({ error: "Group not found" });
    }

    if (group.groupCreator.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Only the group creator can delete this group" });
    }

    await Message.deleteMany({ _id: { $in: group.messages } });
    await Conversation.findByIdAndDelete(groupId);

    // Notify all participants
    group.participants.forEach((pId) => {
      const socketId = getReceiverSocketId(pId);
      if (socketId) {
        io.to(socketId).emit("groupLeft", {
          groupId,
          leftUserId: userId.toString(),
          groupDeleted: true,
        });
      }
    });

    res.status(200).json({ message: "Group deleted successfully" });
  } catch (error) {
    console.log("Error in deleteGroup controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
