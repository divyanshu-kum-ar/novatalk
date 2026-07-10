import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female"], // when we have to choose only male and female two options s here ENUM is used
    },
    profilePic: {
      type: String,
      default: "",
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    pinnedConversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        default: [],
      }
    ],
    mutedConversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        default: [],
      }
    ],
    archivedConversations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        default: [],
      }
    ],
    about: {
      type: String,
      default: "",
      maxLength: 150,
    },
    privacySettings: {
      lastSeen: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      onlineStatus: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      profilePhoto: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      about: {
        type: String,
        enum: ["everyone", "contacts", "nobody"],
        default: "everyone",
      },
      readReceipts: {
        type: Boolean,
        default: true,
      },
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: [],
      }
    ],
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
