import { useState, useEffect, useRef } from "react";
import { BsSend, BsEmojiSmile } from "react-icons/bs";
import useSendMessage from "../../hooks/useSendMessage";
import useConversation from "../../zustand/useConversation";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";

const EMOJIS = [
  "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰", 
  "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🥸", "🤩", "🥳", 
  "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖", "😫", "😩", "🥺", "😢", "😭", "😤", 
  "😠", "😡", "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗", "🤔", "🫣", "🤭", 
  "🤫", "🤥", "😶", "😐", "😑", "😬", "🫨", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢", "🤮", "🤧", 
  "😷", "🤒", "🤕", "🤑", "🤠", "😈", "👿", "👹", "👺", "👻", "💀", "☠️", "👽", "👾", "🤖", "🎃",
  "👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👈", "👉", 
  "👆", "🖕", "👇", "☝️", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", 
  "✍️", "💅", "🤳", "💪", "🧠", "👀", "👅", "👄", "💋", "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", 
  "🤍", "💔", "❣️", "💕", "💞", "💓", "💗", "💖", "💘", "💝", "✨", "🌟", "⭐", "🔥", "💥", "🌈"
];

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const { loading, sendMessage } = useSendMessage();
  const { selectedConversation } = useConversation();
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const [typingTimeout, setTypingTimeout] = useState(null);

  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    setCursorPosition(0);
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    setCursorPosition(e.target.selectionStart);

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

  const saveCursorPosition = (e) => {
    setCursorPosition(e.target.selectionStart);
  };

  const handleEmojiSelect = (emoji) => {
    const input = inputRef.current;
    if (!input) return;

    const start = cursorPosition;
    const text = input.value;
    const before = text.substring(0, start);
    const after = text.substring(start);

    const newMessage = before + emoji + after;
    setMessage(newMessage);
    setShowEmojiPicker(false);

    const newPos = start + emoji.length;
    setCursorPosition(newPos);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <form className="px-4 my-3" onSubmit={handleSubmit}>
      <div className="w-full relative flex items-center gap-2">
        <div className="relative">
          <button
            type="button"
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all duration-200"
            title="Choose emoji"
          >
            <BsEmojiSmile size={20} />
          </button>

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-12 left-0 z-50 w-72 h-64 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-3 flex flex-col gap-2"
            >
              <div className="text-xs font-semibold text-gray-400 border-b border-gray-700 pb-1.5 mb-1">
                Emojis
              </div>
              <div className="grid grid-cols-8 gap-1.5 overflow-y-auto pr-1 select-none scrollbar-thin scrollbar-thumb-gray-600">
                {EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-xl p-1 rounded hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative flex-grow">
          <input
            type="text"
            ref={inputRef}
            className="border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 text-white pr-10"
            placeholder="Send a message"
            value={message}
            onChange={handleInputChange}
            onClick={saveCursorPosition}
            onKeyUp={saveCursorPosition}
            onBlur={saveCursorPosition}
          />
          <button
            type="submit"
            className="absolute inset-y-0 end-0 flex items-center pe-3 text-gray-400 hover:text-white transition-colors"
          >
            {loading ? (
              <div className="loading loading-spinner"></div>
            ) : (
              <BsSend />
            )}
          </button>
        </div>
      </div>
    </form>
  );
};
export default MessageInput;

