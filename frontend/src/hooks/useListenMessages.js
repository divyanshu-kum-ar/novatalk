import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

import { useAuthContext } from "../context/AuthContext";

import notificationSound from "../assets/sounds/notification.mp3";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const state = useConversation.getState();
      const currentMessages = state.messages;
      const activeConv = state.selectedConversation;
      const currentConvs = state.conversations;
      const currentUnreads = state.unreadCounts;

      const senderId = typeof newMessage.senderId === "object" && newMessage.senderId !== null ? newMessage.senderId._id : newMessage.senderId;
      const conversationKey = newMessage.conversationId || senderId;
      const isFromActive = activeConv && activeConv._id === conversationKey;

      // Play notification sound if chat is not muted
      const isMuted = state.mutedChatIds && state.mutedChatIds.includes(conversationKey);
      if (!isMuted) {
        const sound = new Audio(notificationSound);
        sound.play();
      }

      // Show desktop notification if appropriate
      const isFromMe = authUser && authUser._id === senderId;
      if (
        !isFromMe &&
        !isMuted &&
        !isFromActive &&
        !document.hasFocus() &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        const matchedConv = currentConvs.find((c) => c._id === conversationKey);
        let senderName = "";
        let senderAvatar = "";

        if (typeof newMessage.senderId === "object" && newMessage.senderId !== null) {
          senderName = newMessage.senderId.fullName;
          senderAvatar = newMessage.senderId.profilePic;
        } else if (matchedConv) {
          if (matchedConv.isGroup) {
            const participant = matchedConv.participants?.find((p) => (p._id || p) === senderId);
            if (participant) {
              senderName = `${participant.fullName} (${matchedConv.groupName})`;
              senderAvatar = participant.profilePic;
            } else {
              senderName = matchedConv.groupName;
              senderAvatar = matchedConv.groupAvatar;
            }
          } else {
            senderName = matchedConv.fullName;
            senderAvatar = matchedConv.profilePic;
          }
        } else {
          senderName = "New Message";
        }

        let previewText = newMessage.message;
        if (!previewText) {
          if (newMessage.image) {
            previewText = "📷 Image";
          } else if (newMessage.file) {
            previewText = `📁 ${newMessage.fileName || "File"}`;
          } else {
            previewText = "New message";
          }
        }

        const notification = new Notification(senderName, {
          body: previewText,
          icon: senderAvatar || undefined,
        });

        notification.onclick = () => {
          window.focus();
          if (matchedConv) {
            state.setSelectedConversation(matchedConv);
          }
        };
      }

      if (isFromActive) {
        newMessage.shouldShake = true;
        newMessage.status = "read";
        state.setMessages([...currentMessages, newMessage]);
        if (!newMessage.conversationId) {
          socket?.emit("messageRead", { messageId: newMessage._id, senderId: senderId });
        }
      } else {
        const currentCount = currentUnreads[conversationKey] || 0;
        state.setUnreadCounts({
          ...currentUnreads,
          [conversationKey]: currentCount + 1,
        });
        if (!newMessage.conversationId) {
          socket?.emit("messageDelivered", { messageId: newMessage._id, senderId: senderId });
        }
      }

      // Move the conversation with the latest incoming message to the top
      const matchedConv = currentConvs.find((c) => c._id === conversationKey);
      if (matchedConv) {
        const remainingConvs = currentConvs.filter((c) => c._id !== conversationKey);
        state.setConversations([matchedConv, ...remainingConvs]);
      }
    };

    const handleStatusUpdate = ({ messageId, status }) => {
      const state = useConversation.getState();
      state.setMessages(state.messages.map((m) => (m._id === messageId ? { ...m, status } : m)));
    };

    const handleMessagesDelivered = ({ receiverId }) => {
      const state = useConversation.getState();
      state.setMessages(state.messages.map((m) => (m.receiverId === receiverId ? { ...m, status: "delivered" } : m)));
    };

    const handleConversationRead = ({ readerId }) => {
      const state = useConversation.getState();
      state.setMessages(state.messages.map((m) => (m.receiverId === readerId ? { ...m, status: "read" } : m)));
    };

    const handleMessageEdited = (editedMessage) => {
      const state = useConversation.getState();
      state.setMessages(state.messages.map((m) => (m._id === editedMessage._id ? editedMessage : m)));
    };

    const handleMessageDeleted = ({ messageId }) => {
      const state = useConversation.getState();
      state.setMessages(state.messages.filter((m) => m._id !== messageId));
    };

    const handleMessageDeletedForEveryone = (updatedMessage) => {
      const state = useConversation.getState();
      state.setMessages(
        state.messages.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
      );
    };

    const handleReactionUpdate = ({ messageId, reactions }) => {
      const state = useConversation.getState();
      state.setMessages(state.messages.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
    };

    const handleUserOffline = ({ userId, lastSeen }) => {
      const state = useConversation.getState();
      state.setConversations(state.conversations.map(c => c._id === userId ? { ...c, lastSeen } : c));
      if (state.selectedConversation && state.selectedConversation._id === userId) {
        state.setSelectedConversation({ ...state.selectedConversation, lastSeen });
      }
    };

    socket?.on("newMessage", handleNewMessage);
    socket?.on("messageStatusUpdate", handleStatusUpdate);
    socket?.on("messagesDelivered", handleMessagesDelivered);
    socket?.on("conversationRead", handleConversationRead);
    socket?.on("messageEdited", handleMessageEdited);
    socket?.on("messageDeleted", handleMessageDeleted);
    socket?.on("messageDeletedForEveryone", handleMessageDeletedForEveryone);
    socket?.on("messageReactionUpdate", handleReactionUpdate);
    socket?.on("userOffline", handleUserOffline);

    return () => {
      socket?.off("newMessage", handleNewMessage);
      socket?.off("messageStatusUpdate", handleStatusUpdate);
      socket?.off("messagesDelivered", handleMessagesDelivered);
      socket?.off("conversationRead", handleConversationRead);
      socket?.off("messageEdited", handleMessageEdited);
      socket?.off("messageDeleted", handleMessageDeleted);
      socket?.off("messageDeletedForEveryone", handleMessageDeletedForEveryone);
      socket?.off("messageReactionUpdate", handleReactionUpdate);
      socket?.off("userOffline", handleUserOffline);
    };
  }, [socket]);
};
export default useListenMessages;
