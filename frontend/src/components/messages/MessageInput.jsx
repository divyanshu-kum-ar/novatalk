import { useState } from "react";
import { BsSend } from "react-icons/bs";
import useSendMessage from "../../hooks/useSendMessage";
import useConversation from "../../zustand/useConversation";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const { loading, sendMessage } = useSendMessage();
  const { selectedConversation } = useConversation();
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const [typingTimeout, setTypingTimeout] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message) return;

    if (socket && selectedConversation && authUser) {
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedConversation._id,
      });
      if (typingTimeout) clearTimeout(typingTimeout);
    }

    await sendMessage(message);
    setMessage("");
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);

    if (!socket || !selectedConversation || !authUser) return;

    socket.emit("typing", {
      senderId: authUser._id,
      receiverId: selectedConversation._id,
    });

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedConversation._id,
      });
    }, 1000);

    setTypingTimeout(timeout);
  };

  return (
    <form className="px-4 my-3" onSubmit={handleSubmit}>
      <div className="w-full relative">
        <input
          type="text"
          className="border text-sm rounded-lg block w-full p-2.5  bg-gray-700 border-gray-600 text-white"
          placeholder="Send a message"
          value={message}
          onChange={handleInputChange}
        />
        <button
          type="submit"
          className="absolute inset-y-0 end-0 flex items-center pe-3"
        >
          {loading ? (
            <div className="loading loading-spinner"></div>
          ) : (
            <BsSend />
          )}
        </button>
      </div>
    </form>
  );
};
export default MessageInput;
