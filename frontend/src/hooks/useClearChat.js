import { useState } from "react";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const useClearChat = () => {
  const [loading, setLoading] = useState(false);
  const { setMessages, selectedConversation } = useConversation();

  const clearChat = async (conversationId) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/clear/${conversationId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      toast.success("Chat cleared successfully!");

      // If the currently selected conversation is the one cleared, empty the message state
      if (selectedConversation && selectedConversation._id === conversationId) {
        setMessages([]);
      }
      return { success: true };
    } catch (error) {
      toast.error(error.message || "Failed to clear chat");
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return { clearChat, loading };
};

export default useClearChat;
