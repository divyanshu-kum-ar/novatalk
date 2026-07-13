import { useState, useEffect, useRef } from "react";
import { BsSend, BsEmojiSmile, BsImage, BsPaperclip, BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkText, BsFileEarmarkZip, BsFileEarmark, BsPlayBtn } from "react-icons/bs";
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
  const uploadIntervalRef = useRef(null);

  const videoInputRef = useRef(null);
  const [selectedVideo, setSelectedVideo] = useState(null); // { video: base64, name, size }

  const getReplyingSnippet = (msg) => {
    if (!msg) return "";
    if (msg.image) return "📷 Photo";
    if (msg.file) return "📎 File";
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

  const activeConversationIdRef = useRef(null);

  // Switch chat: Save current input as draft for previous chat, load draft for new chat
  useEffect(() => {
    if (activeConversationIdRef.current && activeConversationIdRef.current !== selectedConversation?._id) {
      const prevId = activeConversationIdRef.current;
      const draftKey = `novatalk_draft_${prevId}`;
      if (message.trim() || replyingTo) {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            text: message,
            replyTo: replyingTo ? {
              _id: replyingTo._id,
              message: replyingTo.message,
              image: replyingTo.image,
              file: replyingTo.file,
              fileName: replyingTo.fileName,
              fileSize: replyingTo.fileSize,
              senderId: replyingTo.senderId,
            } : null,
          })
        );
      } else {
        localStorage.removeItem(draftKey);
      }
      window.dispatchEvent(new CustomEvent("novatalk_drafts_updated"));
    }

    if (selectedConversation?._id) {
      const draftKey = `novatalk_draft_${selectedConversation._id}`;
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        const { text, replyTo } = JSON.parse(savedDraft);
        setMessage(text || "");
        setReplyingTo(replyTo || null);
      } else {
        setMessage("");
        setReplyingTo(null);
      }
      activeConversationIdRef.current = selectedConversation._id;
    } else {
      setMessage("");
      setReplyingTo(null);
      activeConversationIdRef.current = null;
    }
  }, [selectedConversation]);

  // Page refresh/close: Save draft for active chat
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (selectedConversation?._id) {
        const draftKey = `novatalk_draft_${selectedConversation._id}`;
        if (message.trim() || replyingTo) {
          localStorage.setItem(
            draftKey,
            JSON.stringify({
              text: message,
              replyTo: replyingTo ? {
                _id: replyingTo._id,
                message: replyingTo.message,
                image: replyingTo.image,
                file: replyingTo.file,
                fileName: replyingTo.fileName,
                fileSize: replyingTo.fileSize,
                senderId: replyingTo.senderId,
              } : null,
            })
          );
        } else {
          localStorage.removeItem(draftKey);
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [message, replyingTo, selectedConversation]);

  // Reply state change: Save draft immediately
  useEffect(() => {
    if (selectedConversation?._id) {
      const draftKey = `novatalk_draft_${selectedConversation._id}`;
      if (message.trim() || replyingTo) {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            text: message,
            replyTo: replyingTo ? {
              _id: replyingTo._id,
              message: replyingTo.message,
              image: replyingTo.image,
              file: replyingTo.file,
              fileName: replyingTo.fileName,
              fileSize: replyingTo.fileSize,
              senderId: replyingTo.senderId,
            } : null,
          })
        );
      } else {
        localStorage.removeItem(draftKey);
      }
      window.dispatchEvent(new CustomEvent("novatalk_drafts_updated"));
    }
  }, [replyingTo]);

  const clearDraft = () => {
    if (selectedConversation?._id) {
      localStorage.removeItem(`novatalk_draft_${selectedConversation._id}`);
      window.dispatchEvent(new CustomEvent("novatalk_drafts_updated"));
    }
  };

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
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setSelectedImage(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearFile = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setSelectedFile(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileAttachmentRef.current) {
      fileAttachmentRef.current.value = "";
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error("Video size must be less than 100 MB");
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    const allowedExtensions = ["mp4", "webm", "mov"];
    const extension = file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      toast.error("Unsupported video format. Please upload MP4, WEBM, or MOV.");
      if (videoInputRef.current) videoInputRef.current.value = "";
      return;
    }

    clearImage();
    clearFile();

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedVideo({
        video: reader.result,
        name: file.name,
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const clearVideo = () => {
    if (uploadIntervalRef.current) {
      clearInterval(uploadIntervalRef.current);
      uploadIntervalRef.current = null;
    }
    setSelectedVideo(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (videoInputRef.current) {
      videoInputRef.current.value = "";
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
      uploadIntervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadIntervalRef.current);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      await sendMessage(message, selectedImage, null, replyingTo?._id);
      
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
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
      uploadIntervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadIntervalRef.current);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      await sendMessage(message, null, selectedFile, replyingTo?._id);
      
      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
      setUploadProgress(100);
      setTimeout(() => {
        clearFile();
        setReplyingTo(null);
        setMessage("");
        setCursorPosition(0);
        clearDraft();
      }, 200);
    } else if (selectedVideo) {
      setIsUploading(true);
      setUploadProgress(10);
      uploadIntervalRef.current = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(uploadIntervalRef.current);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      await sendMessage(message, null, null, replyingTo?._id, selectedVideo);

      if (uploadIntervalRef.current) clearInterval(uploadIntervalRef.current);
      setUploadProgress(100);
      setTimeout(() => {
        clearVideo();
        setReplyingTo(null);
        setMessage("");
        setCursorPosition(0);
        clearDraft();
      }, 200);
    } else {
      await sendMessage(message, null, null, replyingTo?._id);
      setReplyingTo(null);
      setMessage("");
      setCursorPosition(0);
      clearDraft();
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMessage(val);
    setCursorPosition(e.target.selectionStart);

    if (selectedConversation?._id) {
      const draftKey = `novatalk_draft_${selectedConversation._id}`;
      if (val.trim() || replyingTo) {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            text: val,
            replyTo: replyingTo ? {
              _id: replyingTo._id,
              message: replyingTo.message,
              image: replyingTo.image,
              file: replyingTo.file,
              fileName: replyingTo.fileName,
              fileSize: replyingTo.fileSize,
              senderId: replyingTo.senderId,
            } : null,
          })
        );
      } else {
        localStorage.removeItem(draftKey);
      }
      window.dispatchEvent(new CustomEvent("novatalk_drafts_updated"));
    }

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

    if (selectedConversation?._id) {
      const draftKey = `novatalk_draft_${selectedConversation._id}`;
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          text: newMessage,
          replyTo: replyingTo ? {
            _id: replyingTo._id,
            message: replyingTo.message,
            image: replyingTo.image,
            file: replyingTo.file,
            fileName: replyingTo.fileName,
            fileSize: replyingTo.fileSize,
            senderId: replyingTo.senderId,
          } : null,
        })
      );
      window.dispatchEvent(new CustomEvent("novatalk_drafts_updated"));
    }

    const newPos = start + emoji.length;
    setCursorPosition(newPos);

    setTimeout(() => {
      input.focus();
      input.setSelectionRange(newPos, newPos);
    }, 0);
  };

  return (
    <form className="px-4 pb-4 pt-2 sticky bottom-0 z-20 bg-transparent flex flex-col gap-2" onSubmit={handleSubmit}>
      {editingMessage && (
        <div className="flex justify-between items-center bg-slate-900/90 border border-white/5 px-3 py-1.5 rounded-2xl text-xs text-gray-400 shadow-lg backdrop-blur-md animate-fadeIn">
          <span className="font-semibold text-sky-400">Editing message</span>
          <button 
            type="button" 
            onClick={() => setEditingMessage(null)} 
            className="text-xs text-gray-400 hover:text-white font-semibold px-2 py-0.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            Cancel (Esc)
          </button>
        </div>
      )}
      {replyingTo && (
        <div className="flex justify-between items-center bg-slate-900/90 border border-white/5 border-l-4 border-l-sky-500 px-3.5 py-2 rounded-2xl text-xs text-gray-400 shadow-lg backdrop-blur-md animate-fadeIn">
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-sky-400 text-[11px]">
              Replying to {
                (replyingTo.senderId?._id || replyingTo.senderId) === authUser._id 
                  ? "You" 
                  : (typeof replyingTo.senderId === "object" && replyingTo.senderId !== null
                      ? (replyingTo.senderId.fullName || replyingTo.senderId.username || "User")
                      : (selectedConversation?.fullName || "User"))
              }
            </span>
            <span className="truncate max-w-[240px] text-gray-300 mt-0.5">
              {getReplyingSnippet(replyingTo)}
            </span>
          </div>
          <button 
            type="button" 
            onClick={() => setReplyingTo(null)} 
            className="text-gray-400 hover:text-white font-bold p-1 rounded-full hover:bg-slate-800 transition-colors ml-2"
          >
            &times;
          </button>
        </div>
      )}
      {selectedImage && (
        <div className="relative self-start p-1.5 bg-slate-900 border border-white/5 rounded-2xl max-w-[200px] shadow-lg animate-fadeIn">
          <img
            src={selectedImage}
            alt="Upload preview"
            className="h-20 w-auto rounded-xl object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow transition-colors z-20"
          >
            &times;
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/85 rounded-2xl flex flex-col items-center justify-center p-2 space-y-1.5 z-10">
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider animate-pulse">Uploading...</span>
              <div className="w-full bg-slate-700 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center w-full text-[9px] text-gray-400">
                <span>{uploadProgress}%</span>
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-red-400 hover:text-red-300 font-bold underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedFile && (
        <div className="relative self-start p-3 bg-slate-900 border border-white/5 rounded-2xl max-w-[280px] shadow-lg flex items-center gap-3 animate-fadeIn">
          <div className="text-sky-400 bg-slate-800 p-2 rounded-xl">
            {getFileIcon(selectedFile.name)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-white truncate max-w-[150px]">{selectedFile.name}</span>
            <span className="text-[10px] text-gray-400 mt-0.5">{formatBytes(selectedFile.size)}</span>
          </div>
          <button
            type="button"
            onClick={clearFile}
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow transition-colors ml-2 flex-shrink-0 z-20"
          >
            &times;
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/85 rounded-2xl flex flex-col items-center justify-center p-2 space-y-1.5 z-10">
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider animate-pulse">Uploading...</span>
              <div className="w-full bg-slate-700 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center w-full text-[9px] text-gray-400">
                <span>{uploadProgress}%</span>
                <button
                  type="button"
                  onClick={clearFile}
                  className="text-red-400 hover:text-red-300 font-bold underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedVideo && (
        <div className="relative self-start p-1.5 bg-slate-900 border border-white/5 rounded-2xl max-w-[200px] shadow-lg flex flex-col animate-fadeIn">
          <video
            src={selectedVideo.video}
            className="h-20 w-auto rounded-xl object-cover bg-black"
            muted
            disabled
          />
          <span className="text-[9px] text-gray-400 truncate max-w-[180px] mt-1 px-1">{selectedVideo.name}</span>
          <button
            type="button"
            onClick={clearVideo}
            className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow transition-colors z-20"
          >
            &times;
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/85 rounded-2xl flex flex-col items-center justify-center p-2 space-y-1.5 z-10">
              <span className="text-[9px] text-gray-300 font-bold uppercase tracking-wider animate-pulse">Uploading...</span>
              <div className="w-full bg-slate-700 rounded-full h-1 overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center w-full text-[9px] text-gray-400">
                <span>{uploadProgress}%</span>
                <button
                  type="button"
                  onClick={clearVideo}
                  className="text-red-400 hover:text-red-300 font-bold underline transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="w-full flex items-center gap-2">
        {/* Actions Row */}
        <div className="flex items-center gap-0.5 bg-slate-800/40 border border-white/5 rounded-full px-2 py-1 shadow-inner">
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
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-native"
            title="Attach image"
          >
            <BsImage size={16} />
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
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-native"
            title="Attach file"
            id="file-attachment-btn"
          >
            <BsPaperclip size={16} />
          </button>

          <input
            type="file"
            ref={videoInputRef}
            onChange={handleVideoChange}
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-native"
            title="Attach video"
            id="video-attachment-btn"
          >
            <BsPlayBtn size={16} />
          </button>

          <button
            type="button"
            ref={emojiButtonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-native"
            title="Choose emoji"
          >
            <BsEmojiSmile size={16} />
          </button>

          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="absolute bottom-16 left-4 z-50 w-72 h-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 animate-fadeIn"
            >
              <div className="text-[10px] font-bold text-gray-400 border-b border-slate-750 pb-1.5 mb-1 tracking-wider uppercase">
                Emojis
              </div>
              <div className="grid grid-cols-8 gap-1.5 overflow-y-auto pr-1 select-none no-scrollbar">
                {EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleEmojiSelect(emoji)}
                    className="text-xl p-1 rounded-lg hover:bg-slate-800 active:scale-90 transition-all flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Pill Container */}
        <div className="relative flex-grow flex items-center">
          <input
            type="text"
            ref={inputRef}
            className="w-full text-xs rounded-full py-2.5 pl-4 pr-4 bg-slate-800/80 border border-slate-700/50 text-white placeholder-gray-400 focus:border-sky-500 focus:outline-none transition-native shadow-inner"
            placeholder={editingMessage ? "Edit message..." : "Type a message..."}
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
        </div>

        {/* Circular Floating Send Action */}
        <button
          type="submit"
          className="flex-shrink-0 w-9 h-9 rounded-full bg-sky-500 hover:bg-sky-600 active:scale-95 text-white flex items-center justify-center transition-native shadow-lg shadow-sky-500/10 border-none"
        >
          {loading ? (
            <div className="loading loading-spinner loading-xs"></div>
          ) : (
            <BsSend className="w-3.5 h-3.5 ml-0.5" />
          )}
        </button>
      </div>
    </form>
  );
};
export default MessageInput;

