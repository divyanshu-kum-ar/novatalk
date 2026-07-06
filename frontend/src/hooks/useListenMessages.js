import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

import notificationSound from "../assets/sounds/notification.mp3";

const useListenMessages = () => {
  const { socket } = useSocketContext();

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      const state = useConversation.getState();
      const currentMessages = state.messages;
      const activeConv = state.selectedConversation;
      const currentConvs = state.conversations;
      const currentUnreads = state.unreadCounts;

      const isFromActive = newMessage.senderId === activeConv?._id;

      // Play notification sound
      const sound = new Audio(notificationSound);
      sound.play();

      if (isFromActive) {
        newMessage.shouldShake = true;
        newMessage.status = "read";
        state.setMessages([...currentMessages, newMessage]);
        socket?.emit("messageRead", { messageId: newMessage._id, senderId: newMessage.senderId });
      } else {
        const senderId = newMessage.senderId;
        const currentCount = currentUnreads[senderId] || 0;
        state.setUnreadCounts({
          ...currentUnreads,
          [senderId]: currentCount + 1,
        });
        socket?.emit("messageDelivered", { messageId: newMessage._id, senderId: newMessage.senderId });
      }

      // Move the conversation with the latest incoming message to the top
      const matchedConv = currentConvs.find((c) => c._id === newMessage.senderId);
      if (matchedConv) {
        const remainingConvs = currentConvs.filter((c) => c._id !== newMessage.senderId);
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
    socket?.on("messageReactionUpdate", handleReactionUpdate);
    socket?.on("userOffline", handleUserOffline);

    return () => {
      socket?.off("newMessage", handleNewMessage);
      socket?.off("messageStatusUpdate", handleStatusUpdate);
      socket?.off("messagesDelivered", handleMessagesDelivered);
      socket?.off("conversationRead", handleConversationRead);
      socket?.off("messageEdited", handleMessageEdited);
      socket?.off("messageDeleted", handleMessageDeleted);
      socket?.off("messageReactionUpdate", handleReactionUpdate);
      socket?.off("userOffline", handleUserOffline);
    };
  }, [socket]);
};
export default useListenMessages;
