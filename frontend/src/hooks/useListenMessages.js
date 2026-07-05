import { useEffect } from "react";

import { useSocketContext } from "../context/SocketContext";
import useConversation from "../zustand/useConversation";

import notificationSound from "../assets/sounds/notification.mp3";

const useListenMessages = () => {
  const { socket } = useSocketContext();
  const {
    messages,
    setMessages,
    selectedConversation,
    conversations,
    setConversations,
    unreadCounts,
    setUnreadCounts,
  } = useConversation();

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      const isFromActive = newMessage.senderId === selectedConversation?._id;

      // Play notification sound
      const sound = new Audio(notificationSound);
      sound.play();

      if (isFromActive) {
        newMessage.shouldShake = true;
        setMessages([...messages, newMessage]);
      } else {
        const senderId = newMessage.senderId;
        const currentCount = unreadCounts[senderId] || 0;
        setUnreadCounts({
          ...unreadCounts,
          [senderId]: currentCount + 1,
        });
      }

      // Move the conversation with the latest incoming message to the top
      const matchedConv = conversations.find((c) => c._id === newMessage.senderId);
      if (matchedConv) {
        const remainingConvs = conversations.filter((c) => c._id !== newMessage.senderId);
        setConversations([matchedConv, ...remainingConvs]);
      }
    };

    socket?.on("newMessage", handleNewMessage);

    return () => {
      socket?.off("newMessage", handleNewMessage);
    };
  }, [
    socket,
    setMessages,
    messages,
    selectedConversation,
    conversations,
    setConversations,
    unreadCounts,
    setUnreadCounts,
  ]);
};
export default useListenMessages;
