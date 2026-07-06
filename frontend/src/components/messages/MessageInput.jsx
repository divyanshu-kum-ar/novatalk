import { useState, useEffect, useRef } from "react";
import { BsSend, BsEmojiSmile, BsImage, BsPaperclip, BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkText, BsFileEarmarkZip, BsFileEarmark } from "react-icons/bs";
import useSendMessage from "../../hooks/useSendMessage";
import useConversation from "../../zustand/useConversation";
import { useSocketContext } from "../../context/SocketContext";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

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

const formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const getFileIcon = (fileName) => {
  if (!fileName) return <BsFileEarmark size={24} />;
  const ext = fileName.split('.').pop().toLowerCase();
  switch (ext) {
    case 'pdf':
      return <BsFileEarmarkPdf size={24} />;
    case 'doc':
    case 'docx':
      return <BsFileEarmarkWord size={24} />;
    case 'txt':
      return <BsFileEarmarkText size={24} />;
    case 'zip':
      return <BsFileEarmarkZip size={24} />;
    default:
      return <BsFileEarmark size={24} />;
  }
};

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const { loading, sendMessage } = useSendMessage();
  const { selectedConversation, messages, setMessages, editingMessage, setEditingMessage, replyingTo, setReplyingTo } = useConversation();
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();
  const [typingTimeout, setTypingTimeout] = useState(null);

  const getReplyingSnippet = (msg) => {
    if (!msg) return "";
    if (msg.image) return "📷 Photo";
    if (msg.file) return `📄 ${msg.fileName}`;
    return msg.message || "";
  };

  const inputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const emojiButtonRef = useRef(null);
  const fileInputRef = useRef(null);
  const fileAttachmentRef = useRef(null);

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

  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.message);
      inputRef.current?.focus();
    } else {
      setMessage("");
    }
  }, [editingMessage]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5 MB");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Unsupported file type. Please upload JPG, JPEG, PNG, GIF, or WEBP.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    clearFile();

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10 MB");
      if (fileAttachmentRef.current) fileAttachmentRef.current.value = "";
      return;
    }

    const allowedExtensions = ["pdf", "doc", "docx", "txt", "zip"];
    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      toast.error("Unsupported file type. Please upload PDF, DOC, DOCX, TXT, or ZIP.");
      if (fileAttachmentRef.current) fileAttachmentRef.current.value = "";
      return;
    }

    clearImage();

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedFile({
        file: reader.result,
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setSelectedImage(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileAttachmentRef.current) {
      fileAttachmentRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message && !selectedImage && !selectedFile) return;

    if (socket && selectedConversation && authUser) {
      socket.emit("stopTyping", {
        senderId: authUser._id,
        receiverId: selectedConversation._id,
      });
      if (typingTimeout) clearTimeout(typingTimeout);
    }

    if (editingMessage) {
      try {
        const res = await fetch(`/api/messages/edit/${editingMessage._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setMessages(messages.map((m) => (m._id === editingMessage._id ? data : m)));
        setEditingMessage(null);
        setMessage("");
        setCursorPosition(0);
      } catch (err) {
        toast.error(err.message);
      }
    } else if (selectedImage) {
      setIsUploading(true);
      setUploadProgress(10);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      await sendMessage(message, selectedImage, null, replyingTo?._id);
      
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        clearImage();
        setReplyingTo(null);
        setMessage("");
        setCursorPosition(0);
      }, 200);
    } else if (selectedFile) {
      setIsUploading(true);
      setUploadProgress(10);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      await sendMessage(message, null, selectedFile, replyingTo?._id);
      
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        clearFile();
        setReplyingTo(null);
        setMessage("");
        setCursorPosition(0);
      }, 200);
    } else {
      await sendMessage(message, null, null, replyingTo?._id);
      setReplyingTo(null);
      setMessage("");
      setCursorPosition(0);
    }
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
    <form className="px-4 my-3 flex flex-col gap-2" onSubmit={handleSubmit}>
      {editingMessage && (
        <div className="flex justify-between items-center bg-gray-800 px-3 py-1 rounded-lg text-xs text-gray-400 border border-gray-700 shadow-md">
          <span className="font-semibold text-blue-400">Editing message</span>
          <button 
            type="button" 
            onClick={() => setEditingMessage(null)} 
            className="text-gray-400 hover:text-white font-bold px-1.5 py-0.5 rounded hover:bg-gray-700 transition-colors"
          >
            Cancel (Esc)
          </button>
        </div>
      )}
      {replyingTo && (
        <div className="flex justify-between items-center bg-gray-800 px-3 py-2 rounded-lg text-xs text-gray-400 border-l-4 border-blue-500 shadow-md">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-blue-400">
              Replying to {replyingTo.senderId === authUser._id ? "You" : selectedConversation?.fullName}
            </span>
            <span className="truncate max-w-[240px] text-gray-300">
              {getReplyingSnippet(replyingTo)}
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setReplyingTo(null)} 
            className="text-gray-400 hover:text-white font-bold px-1.5 py-0.5 rounded hover:bg-gray-700 transition-colors ml-2"
          >
            &times;
          </button>
        </div>
      )}
      {selectedImage && (
        <div className="relative self-start p-1 bg-gray-800 border border-gray-700 rounded-lg max-w-[200px] shadow-lg">
          <img
            src={selectedImage}
            alt="Upload preview"
            className="h-20 w-auto rounded object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow transition-colors"
          >
            &times;
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex flex-col items-center justify-center p-1">
              <div className="w-4/5 bg-gray-700 rounded-full h-1.5 mb-1 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-white font-medium">{uploadProgress}%</span>
            </div>
          )}
        </div>
      )}

      {selectedFile && (
        <div className="relative self-start p-3 bg-gray-800 border border-gray-700 rounded-lg max-w-[280px] shadow-lg flex items-center gap-3">
          <div className="text-blue-500">
            {getFileIcon(selectedFile.name)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-white truncate max-w-[180px]">{selectedFile.name}</span>
            <span className="text-[10px] text-gray-400">{formatBytes(selectedFile.size)}</span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow transition-colors ml-2 flex-shrink-0"
          >
            &times;
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-75 rounded-lg flex flex-col items-center justify-center p-1">
              <div className="w-4/5 bg-gray-700 rounded-full h-1.5 mb-1 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span className="text-[10px] text-white font-medium">{uploadProgress}%</span>
            </div>
          )}
        </div>
      )}

      <div className="w-full relative flex items-center gap-2">
        <div className="relative flex items-center gap-1.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/jpg, image/png, image/gif, image/webp"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all duration-200"
            title="Attach image"
          >
            <BsImage size={20} />
          </button>

          <input
            type="file"
            ref={fileAttachmentRef}
            onChange={handleAttachmentChange}
            accept=".pdf,.doc,.docx,.txt,.zip"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileAttachmentRef.current?.click()}
            className="flex items-center justify-center p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-all duration-200"
            title="Attach file"
            id="file-attachment-btn"
          >
            <BsPaperclip size={20} />
          </button>

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
            placeholder={editingMessage ? "Edit message..." : "Send a message"}
            value={message}
            onChange={handleInputChange}
            onClick={saveCursorPosition}
            onKeyUp={saveCursorPosition}
            onBlur={saveCursorPosition}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setEditingMessage(null);
              }
            }}
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

