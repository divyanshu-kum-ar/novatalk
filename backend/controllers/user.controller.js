import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";

export const getUsers = async (req, res) => {
  try {
    const loggedInUser = req.user._id;

    const allUsers = await User.find({ _id: { $ne: loggedInUser } }).select(
      "-password"
    ); // { _id: { $ne: loggedInUser }.select("-password") gives all the users expect the loggedin user and without the password

    const groups = await Conversation.find({
      isGroup: true,
      participants: loggedInUser,
    }).populate("participants", "-password");

    res.status(200).json([...groups, ...allUsers]);
  } catch (error) {
    console.log("Error in getUsers controller:", error);
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
