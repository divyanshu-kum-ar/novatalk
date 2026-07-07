import Conversation from "../models/conversation.model.js";

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

    res.status(200).json(populatedGroup);
  } catch (error) {
    console.log("Error in updateGroup controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
