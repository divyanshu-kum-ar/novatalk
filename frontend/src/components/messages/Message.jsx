import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import { useState } from "react";
import { BsDownload, BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkText, BsFileEarmarkZip, BsFileEarmark, BsThreeDotsVertical, BsTelephoneInboundFill, BsTelephoneOutboundFill, BsTelephoneXFill, BsCameraVideoFill } from "react-icons/bs";
import toast from "react-hot-toast";

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

const downloadFile = (base64Data, fileName) => {
  const link = document.createElement("a");
  link.href = base64Data;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_MALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2363b3ed'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_FEMALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f687b3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const getDefaultAvatar = (gender) => {
  if (gender === "male") return DEFAULT_AVATAR_MALE;
  if (gender === "female") return DEFAULT_AVATAR_FEMALE;
  return DEFAULT_AVATAR_GENERIC;
};

const Message = ({ message }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation, messages, setMessages, setEditingMessage, setReplyingTo } = useConversation();
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  let pressTimer;
  const handleTouchStart = () => {
    pressTimer = setTimeout(() => {
      setShowPicker(true);
    }, 500);
  };
  const handleTouchEnd = () => {
    clearTimeout(pressTimer);
  };

  const handleMouseEnter = () => {
    if (window.matchMedia("(hover: hover)").matches) {
      setShowPicker(true);
    }
  };

  const handleMouseLeave = () => {
    if (window.matchMedia("(hover: hover)").matches) {
      setShowPicker(false);
    }
  };

  const handleReact = async (emoji) => {
    try {
      const res = await fetch(`/api/messages/react/${message._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ emoji }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(
        messages.map((m) => (m._id === message._id ? { ...m, reactions: data } : m))
      );
      setShowPicker(false);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getReactionUsernames = (usersList) => {
    return usersList
      .map((u) => {
        if (typeof u === "object" && u !== null) {
          return u.username === authUser.username ? "You" : u.username;
        }
        return "Someone";
      })
      .filter(Boolean)
      .join(", ");
  };

  const handleReactionClick = (emoji, userNames) => {
    handleReact(emoji);
    toast(`${emoji} reactions: ${userNames}`, { id: `react-toast-${message._id}` });
  };

  const reactions = message.reactions || [];
  const groupedReactions = {};
  reactions.forEach((r) => {
    if (r.userId) {
      if (!groupedReactions[r.emoji]) {
        groupedReactions[r.emoji] = [];
      }
      groupedReactions[r.emoji].push(r.userId);
    }
  });

  const handleDelete = async (messageId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this message?");
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/messages/delete/${messageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setMessages(messages.filter((m) => m._id !== messageId));
      toast.success("Message deleted successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const senderIdStr = typeof message.senderId === "object" && message.senderId !== null ? message.senderId._id : message.senderId;
  const fromMe = String(senderIdStr) === String(authUser._id);
  const formattedTime = extractTime(message.createdAt);

  if (message.isCallLog) {
    const isCompleted = message.callLog?.type === "completed";
    const isVideo = message.callLog?.callType === "video";
    
    let titleText = "";
    let statusText = "";
    let IconComponent = null;
    let iconBgColor = "";
    let iconColor = "";

    const duration = message.callLog?.duration || 0;
    const mins = Math.floor(duration / 60);
    const secs = duration % 60;
    const durationStr = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

    if (isVideo) {
      if (isCompleted) {
        titleText = fromMe ? "Outgoing video call" : "Incoming video call";
        statusText = `Video call ended (${durationStr})`;
        IconComponent = BsCameraVideoFill;
        iconBgColor = fromMe ? "bg-blue-500/20" : "bg-emerald-500/20";
        iconColor = fromMe ? "text-blue-400" : "text-emerald-400";
      } else {
        if (fromMe) {
          titleText = "Outgoing video call";
          statusText = "Unanswered";
          IconComponent = BsCameraVideoFill;
          iconBgColor = "bg-gray-700/30";
          iconColor = "text-gray-400";
        } else {
          titleText = "Missed video call";
          statusText = "Missed call";
          IconComponent = BsCameraVideoFill;
          iconBgColor = "bg-red-500/20";
          iconColor = "text-red-400";
        }
      }
    } else {
      if (isCompleted) {
        titleText = fromMe ? "Outgoing voice call" : "Incoming voice call";
        statusText = `Call ended (${durationStr})`;
        IconComponent = fromMe ? BsTelephoneOutboundFill : BsTelephoneInboundFill;
        iconBgColor = fromMe ? "bg-blue-500/20" : "bg-emerald-500/20";
        iconColor = fromMe ? "text-blue-400" : "text-emerald-400";
      } else {
        if (fromMe) {
          titleText = "Outgoing voice call";
          statusText = "Unanswered";
          IconComponent = BsTelephoneOutboundFill;
          iconBgColor = "bg-gray-700/30";
          iconColor = "text-gray-400";
        } else {
          titleText = "Missed voice call";
          statusText = "Missed call";
          IconComponent = BsTelephoneXFill;
          iconBgColor = "bg-red-500/20";
          iconColor = "text-red-400";
        }
      }
    }

    return (
      <div className="flex justify-center my-2.5 w-full select-none animate-fade-in">
        <div className="flex items-center gap-3.5 px-4 py-2.5 bg-gray-800/30 backdrop-blur-md border border-gray-700/30 rounded-2xl max-w-[85%] sm:max-w-[70%] shadow-lg shadow-black/10 transition-all hover:bg-gray-800/40">
          <div className={`w-8 h-8 rounded-xl ${iconBgColor} flex items-center justify-center flex-shrink-0 transition-colors`}>
            {IconComponent && <IconComponent className={iconColor} size={15} />}
          </div>
          <div className="flex flex-col min-w-0 pr-1">
            <span className="text-xs font-semibold text-gray-100 tracking-wide">
              {titleText}
            </span>
            <span className="text-[10px] text-gray-400/90 font-medium mt-0.5 flex items-center gap-1.5 whitespace-nowrap">
              <span>{statusText}</span>
              <span className="w-1 h-1 rounded-full bg-gray-600 inline-block"></span>
              <span>{formattedTime}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe
    ? authUser.profilePic
    : (typeof message.senderId === "object" && message.senderId !== null ? message.senderId.profilePic : selectedConversation?.profilePic);
  const bubbleBgColor = fromMe ? "bg-blue-500" : "";

  const shakeClass = message.shouldShake ? "shake" : "";

  const senderGender = fromMe ? authUser.gender : (typeof message.senderId === "object" && message.senderId !== null ? message.senderId.gender : selectedConversation?.gender);

  const profilePicSrc = (profilePic && !profilePic.includes("avatar.iran.liara.run"))
    ? profilePic
    : getDefaultAvatar(senderGender);

  const getStatusIcon = () => {
    if (message.status === "read") return <span className="text-blue-400 ml-1 font-bold">✓✓</span>;
    if (message.status === "delivered") return <span className="text-gray-400 ml-1 font-bold">✓✓</span>;
    return <span className="text-gray-400 ml-1 font-bold">✓</span>;
  };

  return (
    <div id={`msg-${message._id}`} className={`chat ${chatClassName}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full bg-slate-700 flex items-center justify-center">
          <img
            alt="Tailwind CSS chat bubble component"
            src={profilePicSrc}
            onError={(e) => {
              e.target.src = getDefaultAvatar(senderGender);
            }}
          />
        </div>
      </div>
      <div
        className={`chat-bubble text-white ${shakeClass} ${bubbleBgColor} pb-2 flex flex-col gap-1.5 relative group ${fromMe ? "pr-7" : ""} min-w-[85px]`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowPicker(true);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {selectedConversation?.isGroup && !fromMe && (
          <span className="text-xs text-sky-300 font-semibold block mb-0.5 select-none">
            {typeof message.senderId === "object" && message.senderId !== null ? message.senderId.fullName : "User"}
          </span>
        )}
        {showPicker && (
          <div
            className={`absolute bottom-[105%] ${fromMe ? "right-0" : "left-0"} mb-1 bg-gray-800 border border-gray-700 rounded-full py-1 px-2.5 flex gap-1.5 shadow-xl z-50 animate-fade-in`}
            onMouseEnter={() => setShowPicker(true)}
            onMouseLeave={() => setShowPicker(false)}
          >
            {["❤️", "😂", "👍", "👎", "😮", "😢", "😡", "🎉"].map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReact(emoji);
                }}
                className="hover:scale-125 transition-transform text-lg p-1 focus:outline-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity dropdown dropdown-left dropdown-end z-10">
          <div tabIndex={0} role="button" className="text-gray-300 hover:text-white cursor-pointer p-0.5 rounded hover:bg-black hover:bg-opacity-25">
            <BsThreeDotsVertical size={14} />
          </div>
          <ul tabIndex={0} className="dropdown-content z-20 menu p-1 shadow bg-gray-800 border border-gray-700 rounded-box w-20 text-[10px] text-white">
            {fromMe && (
              <>
                <li><button type="button" onClick={() => setEditingMessage(message)} className="hover:bg-gray-700">Edit</button></li>
                <li><button type="button" onClick={() => handleDelete(message._id)} className="text-red-500 hover:text-red-400 hover:bg-gray-700">Delete</button></li>
              </>
            )}
            <li><button type="button" onClick={() => setReplyingTo(message)} className="hover:bg-gray-700">Reply</button></li>
          </ul>
        </div>
        {message.replyTo && (
          <div 
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById(`msg-${message.replyTo._id}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.classList.add("bg-blue-900", "bg-opacity-30", "transition-all", "duration-300");
                setTimeout(() => {
                  element.classList.remove("bg-blue-900", "bg-opacity-30");
                }, 1500);
              }
            }}
            className="cursor-pointer mb-1 p-2 bg-black bg-opacity-20 hover:bg-opacity-30 border-l-4 border-blue-500 rounded text-xs text-gray-300 flex flex-col gap-0.5"
          >
            <span className="font-semibold text-blue-400">
              {message.replyTo.senderId === authUser._id ? "You" : (selectedConversation?.isGroup ? "User" : selectedConversation?.fullName)}
            </span>
            <span className="truncate max-w-[200px]">
              {message.replyTo.image ? "📷 Photo" : message.replyTo.file ? `📄 ${message.replyTo.fileName}` : message.replyTo.message}
            </span>
          </div>
        )}
        {message.image && (
          <div className="relative cursor-pointer max-w-[240px] overflow-hidden rounded-lg group">
            <img
              src={message.image}
              alt="Shared content"
              className="max-h-48 object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-200"
              onClick={() => setShowLightbox(true)}
            />
          </div>
        )}
        {message.file && (
          <div className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg min-w-[200px] max-w-[280px]">
            <div className="text-blue-400 text-2xl flex-shrink-0">
              {getFileIcon(message.fileName)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate" title={message.fileName}>
                {message.fileName}
              </span>
              <span className="text-xs text-gray-400">
                {formatBytes(message.fileSize)}
              </span>
            </div>
            <button
              onClick={() => downloadFile(message.file, message.fileName)}
              className="p-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg transition-all flex-shrink-0"
              title="Download file"
            >
              <BsDownload size={16} />
            </button>
          </div>
        )}
        {message.message && (
          <span className="break-words">
            {message.message}
            {message.edited && <span className="text-[9px] opacity-60 ml-1.5 select-none font-normal">(edited)</span>}
          </span>
        )}
      </div>
      {Object.keys(groupedReactions).length > 0 && (
        <div className={`flex flex-wrap gap-1 mt-1 max-w-[280px] ${fromMe ? "justify-end" : "justify-start"}`}>
          {Object.entries(groupedReactions).map(([emoji, users]) => {
            const hasReacted = users.some(
              (u) => {
                const id = typeof u === "object" && u !== null ? u._id : u;
                return String(id) === String(authUser._id);
              }
            );
            const userNames = getReactionUsernames(users);
            return (
              <div
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReactionClick(emoji, userNames);
                }}
                className={`group/react relative flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs cursor-pointer select-none transition-all ${
                  hasReacted
                    ? "bg-blue-600 bg-opacity-30 border border-blue-500 text-white"
                    : "bg-gray-800 bg-opacity-50 border border-gray-700 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <span>{emoji}</span>
                <span className="font-semibold">{users.length}</span>
                
                <div className={`absolute bottom-full mb-2 hidden group-hover/react:block bg-gray-900 text-white text-[10px] rounded py-1 px-2 whitespace-nowrap z-[100] shadow-lg border border-gray-700 ${fromMe ? "right-0" : "left-0"}`}>
                  {userNames}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
        {formattedTime}
        {fromMe && getStatusIcon()}
      </div>

      {showLightbox && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-90 p-4"
          onClick={() => setShowLightbox(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex items-center justify-center">
            <img
              src={message.image}
              alt="Enlarged view"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
            <button
              className="absolute top-[-40px] right-0 text-white text-3xl font-semibold bg-gray-800 bg-opacity-60 hover:bg-opacity-80 rounded-full w-10 h-10 flex items-center justify-center transition-colors"
              onClick={() => setShowLightbox(false)}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default Message;
