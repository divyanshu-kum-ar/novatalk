import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useForwardMessage = () => {
  const [loading, setLoading] = useState(false);
  const { messages, setMessages, selectedConversation } = useConversation();

  const forwardMessage = async (messageId, targetChatIds) => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages/forward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messageId, targetChatIds }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Message forwarded successfully!");

      // Update current message list if the selected conversation is one of the recipients
      if (selectedConversation) {
        const matchingMsg = data.find((newMsg) => {
          if (selectedConversation.isGroup) {
            return newMsg.conversationId === selectedConversation._id;
          } else {
            return (
              String(newMsg.receiverId) === String(selectedConversation._id) ||
              String(newMsg.senderId) === String(selectedConversation._id)
            );
          }
        });
        if (matchingMsg) {
          setMessages([...messages, matchingMsg]);
        }
      }
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Failed to forward message");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { forwardMessage, loading };
};

export default useForwardMessage;
