import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import { useState, useEffect, useRef } from "react";
import { BsDownload, BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkText, BsFileEarmarkZip, BsFileEarmark, BsThreeDotsVertical, BsTelephoneInboundFill, BsTelephoneOutboundFill, BsTelephoneXFill, BsCameraVideoFill, BsPlayFill, BsPauseFill } from "react-icons/bs";
import toast from "react-hot-toast";
import LinkPreview from "./LinkPreview";

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;

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

/* Custom seekable Voice Message Player component */
const VoiceMessagePlayer = ({ src, duration, messageId, fromMe, formattedTime, statusIcon }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlayEvent = (e) => {
      if (e.detail.messageId !== messageId) {
        audio.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener("novatalk_audio_play", handlePlayEvent);

    return () => {
      window.removeEventListener("novatalk_audio_play", handlePlayEvent);
      audio.pause();
    };
  }, [messageId]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Dispatch play event to pause others
      window.dispatchEvent(
        new CustomEvent("novatalk_audio_play", { detail: { messageId } })
      );
      audio.play().catch((err) => console.log("Audio play failed:", err));
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
      setTotalDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleWaveformClick = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const percent = Math.max(0, Math.min(1, clickX / width));
    const newTime = percent * totalDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (timeInSeconds) => {
    if (isNaN(timeInSeconds)) return "0:00";
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className="flex flex-col w-full relative">
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />
      {/* Upper Row: Play button + Waveform Area */}
      <div className="flex items-center gap-3 w-full">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 border-none cursor-pointer shrink-0 shadow-md ${
            fromMe
              ? "bg-white text-sky-600 hover:bg-slate-50"
              : "bg-sky-500 text-white hover:bg-sky-600"
          }`}
          aria-label={isPlaying ? "Pause voice message" : "Play voice message"}
        >
          {isPlaying ? (
            <BsPauseFill size={22} className={fromMe ? "text-sky-600" : "text-white"} />
          ) : (
            <BsPlayFill size={22} className={`ml-0.5 ${fromMe ? "text-sky-600" : "text-white"}`} />
          )}
        </button>

        {/* Waveform / Progress Area */}
        <div className="flex-grow flex flex-col justify-center min-w-0 relative">
          <div 
            className="h-6 flex items-center gap-[3px] w-full cursor-pointer select-none relative" 
            onClick={handleWaveformClick}
            title="Seek playback position"
          >
            {Array.from({ length: 24 }).map((_, i) => {
              // Deterministic bar height sequence to render a premium dynamic wave
              const heights = [6, 12, 16, 10, 6, 8, 14, 18, 10, 8, 12, 14, 8, 6, 10, 14, 18, 12, 6, 8, 14, 10, 8, 6];
              const height = heights[i % heights.length];
              
              const barPercent = (i / 24) * 100;
              const currentPercent = (currentTime / (totalDuration || 1)) * 100;
              const isPlayed = barPercent <= currentPercent;

              return (
                <span
                  key={i}
                  className={`w-[3px] rounded-full transition-colors duration-150 flex-shrink-0 ${
                    isPlayed
                      ? (fromMe ? "bg-white" : "bg-sky-400")
                      : (fromMe ? "bg-white/30" : "bg-slate-600")
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacing & Metadata Row: time indicators and timestamp placement inside the bubble */}
      <div className="flex justify-between items-center w-full pl-[52px] text-[10px] font-bold text-gray-400/90 mt-1.5 select-none pr-1">
        <div className="flex items-center gap-3">
          <span className={fromMe ? "text-sky-100/90" : "text-gray-400"}>
            {formatTime(currentTime)}
          </span>
          <span className="opacity-40">/</span>
          <span className={fromMe ? "text-sky-100/90" : "text-gray-400"}>
            {formatTime(totalDuration)}
          </span>
        </div>

        {/* Timestamp inside the bubble */}
        <div className="flex items-center gap-1 text-[9px] font-bold opacity-75 self-end translate-y-1">
          <span className={fromMe ? "text-sky-100/90" : "text-gray-405"}>{formattedTime}</span>
          {statusIcon}
        </div>
      </div>
    </div>
  );
};

const Message = ({ message, isLastInGroup = true }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation, messages, setMessages, setEditingMessage, setReplyingTo, searchQuery, setForwardingMessage, highlightedMessageId } = useConversation();
  const [showLightbox, setShowLightbox] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const highlightText = (text, query) => {
    if (!query || !query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase()
            ? <mark key={index} className="bg-yellow-500 text-black rounded px-0.5">{part}</mark>
            : part
        )}
      </>
    );
  };

  const renderMessageText = (text) => {
    if (!text) return null;
    const parts = text.split(URL_REGEX);
    return parts.map((part, index) => {
      if (part.match(URL_REGEX)) {
        let href = part;
        if (!href.startsWith("http://") && !href.startsWith("https://")) {
          href = "https://" + href;
        }
        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-300 hover:underline break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {highlightText(part, searchQuery)}
          </a>
        );
      }
      return highlightText(part, searchQuery);
    });
  };

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

  const handleDelete = async (messageId, deleteType) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete this message ${deleteType === "me" ? "for you" : "for everyone"}?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/messages/delete/${messageId}?type=${deleteType}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type: deleteType }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (deleteType === "me") {
        setMessages(messages.filter((m) => m._id !== messageId));
        toast.success("Message deleted for you");
      } else {
        setMessages(messages.map((m) => (m._id === messageId ? data : m)));
        toast.success("Message deleted for everyone");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const senderIdStr = typeof message.senderId === "object" && message.senderId !== null ? message.senderId._id : message.senderId;
  const fromMe = String(senderIdStr) === String(authUser._id);
  const formattedTime = extractTime(message.createdAt);

  if (message.isSystem) {
    return (
      <div className="flex justify-center my-1.5 w-full select-none animate-fade-in">
        <div className="px-3.5 py-1 bg-slate-900/35 backdrop-blur-sm border border-white/5 rounded-full shadow-sm max-w-max text-center">
          <span className="text-[11px] text-gray-400 font-medium tracking-wide">
            {message.message}
          </span>
        </div>
      </div>
    );
  }

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

  const bubbleBorderRadius = fromMe
    ? (isLastInGroup ? "rounded-2xl rounded-tr-none" : "rounded-2xl")
    : (isLastInGroup ? "rounded-2xl rounded-tl-none" : "rounded-2xl");

  const bubbleBgColor = message.audio
    ? (fromMe
        ? `bg-gradient-to-br from-sky-500 to-sky-600 text-white border border-sky-400/20 shadow-md ${bubbleBorderRadius}`
        : `bg-slate-850 text-slate-100 border border-white/5 shadow-md ${bubbleBorderRadius}`
      )
    : (fromMe
        ? `bg-gradient-to-br from-sky-500/90 to-sky-600/90 text-white shadow-md border border-sky-400/10 ${bubbleBorderRadius}`
        : `bg-slate-800/90 text-slate-100 border border-white/5 shadow-md ${bubbleBorderRadius}`
      );

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

      const isHighlighted = highlightedMessageId === message._id;
      const highlightClass = isHighlighted ? "ring-2 ring-yellow-400 bg-yellow-500/30 scale-[1.01] shadow-yellow-500/20 shadow-lg" : "";

      return (
        <div id={`msg-${message._id}`} className={`chat ${chatClassName}`}>
          <div className={`chat-image avatar ${message.audio ? "self-end pb-1" : ""} ${isLastInGroup ? "" : "invisible"}`}>
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
            className={`chat-bubble text-white ${shakeClass} ${bubbleBgColor} ${highlightClass} max-w-[82%] md:max-w-[75%] ${
              message.audio
                ? "w-[280px] sm:w-[300px] min-h-[78px] p-3.5 pb-2 hover:bg-opacity-95"
                : "pb-2.5 flex flex-col gap-2 " + (fromMe ? "pr-8" : "")
            } flex flex-col gap-2 relative group min-w-[90px] transition-all duration-300`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => {
          e.preventDefault();
          setReplyingTo(message);
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {message.isForwarded && (
          <span className="text-[9px] text-gray-300 italic flex items-center gap-1 select-none font-medium mb-0.5">
            ↪ Forwarded
          </span>
        )}
        {selectedConversation?.isGroup && !fromMe && (
          <span className="text-xs text-sky-300 font-semibold block mb-0.5 select-none">
            {typeof message.senderId === "object" && message.senderId !== null ? message.senderId.fullName : "User"}
          </span>
        )}
        {showPicker && !message.isDeletedForEveryone && (
          <div
            className={`absolute bottom-[105%] ${fromMe ? "right-0" : "left-0"} mb-1 bg-slate-900 border border-slate-700 rounded-full py-1 px-2.5 flex gap-1.5 shadow-2xl z-50 animate-fadeIn`}
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
                className="hover:scale-125 transition-transform text-lg p-0.5 focus:outline-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        {!message.isDeletedForEveryone && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity dropdown dropdown-left dropdown-end z-10">
            <div tabIndex={0} role="button" className="text-gray-300 hover:text-white cursor-pointer p-0.5 rounded-lg hover:bg-black/20">
              <BsThreeDotsVertical size={13} />
            </div>
            <ul tabIndex={0} className="dropdown-content z-20 menu p-1 shadow-2xl bg-slate-900 border border-slate-700/80 rounded-xl w-32 text-[10px] text-white">
              {fromMe && (
                <>
                  <li><button type="button" onClick={() => setEditingMessage(message)} className="hover:bg-slate-800 rounded-lg py-1.5">Edit</button></li>
                  <li><button type="button" onClick={() => handleDelete(message._id, "me")} className="text-red-500 hover:text-red-400 hover:bg-slate-800 rounded-lg py-1.5">Delete for Me</button></li>
                  <li><button type="button" onClick={() => handleDelete(message._id, "everyone")} className="text-red-500 hover:text-red-400 hover:bg-slate-800 rounded-lg py-1.5">Delete for Everyone</button></li>
                </>
              )}
              <li><button type="button" onClick={() => setReplyingTo(message)} className="hover:bg-slate-800 rounded-lg py-1.5">Reply</button></li>
              <li><button type="button" onClick={() => setForwardingMessage(message)} className="hover:bg-slate-800 rounded-lg py-1.5">Forward</button></li>
            </ul>
          </div>
        )}
        {message.replyTo && (
          <div
            onClick={(e) => {
              e.preventDefault();
              const element = document.getElementById(`msg-${message.replyTo._id}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                const bubble = element.querySelector(".chat-bubble");
                if (bubble) {
                  bubble.classList.add("ring-4", "ring-blue-400", "transition-all", "duration-300");
                  setTimeout(() => {
                    bubble.classList.remove("ring-4", "ring-blue-400");
                  }, 1500);
                }
              }
            }}
            className="cursor-pointer mb-1 p-2 bg-slate-950/40 hover:bg-slate-950/60 border-l-4 border-sky-400 rounded-lg text-[10px] text-gray-300 flex flex-col gap-0.5"
          >
            <span className="font-semibold text-sky-400">
              {
                (() => {
                  const replyToSenderId = message.replyTo.senderId?._id || message.replyTo.senderId;
                  return replyToSenderId === authUser._id
                    ? "You"
                    : (typeof message.replyTo.senderId === "object" && message.replyTo.senderId !== null
                      ? (message.replyTo.senderId.fullName || message.replyTo.senderId.username || "User")
                      : (selectedConversation?.isGroup ? "User" : selectedConversation?.fullName));
                })()
              }
            </span>
            <span className="truncate max-w-[180px]">
              {message.replyTo.image ? "📷 Photo" : message.replyTo.video ? "🎥 Video" : message.replyTo.file ? "📎 File" : message.replyTo.audio ? "🎙️ Voice Message" : message.replyTo.message}
            </span>
          </div>
        )}
        {message.image && (
          <div className="relative cursor-pointer max-w-[240px] overflow-hidden rounded-xl group border border-white/5">
            <img
              src={message.image}
              alt="Shared content"
              className="max-h-48 w-full object-cover rounded-xl group-hover:scale-[1.03] transition-transform duration-200"
              onClick={() => setShowLightbox(true)}
            />
          </div>
        )}
        {message.file && (
          <div className="flex items-center gap-3 p-2.5 bg-slate-950/30 border border-white/5 rounded-2xl min-w-[200px] max-w-[280px]">
            <div className="text-sky-400 text-xl flex-shrink-0 bg-slate-800/80 p-2 rounded-xl">
              {getFileIcon(message.fileName)}
            </div>
            <div className="flex flex-col min-w-0 flex-grow pr-1">
              <span className="text-xs font-semibold text-white truncate" title={message.fileName}>
                {highlightText(message.fileName, searchQuery)}
              </span>
              <span className="text-[10px] text-gray-400">
                {formatBytes(message.fileSize)}
              </span>
            </div>
            <button
              onClick={() => downloadFile(message.file, message.fileName)}
              className="w-8 h-8 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-xl transition-all flex flex-shrink-0 items-center justify-center border-none"
              title="Download file"
            >
              <BsDownload size={13} />
            </button>
          </div>
        )}
        {message.video && (
          <div className="flex flex-col gap-1.5 max-w-[280px]">
            <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-slate-950/30 shadow-inner flex flex-col">
              <video
                src={message.video}
                controls
                className="w-full max-h-48 object-contain rounded-t-2xl bg-black"
              />
              <div className="flex justify-between items-center gap-2 p-2 bg-slate-900/60 backdrop-blur-sm border-t border-white/5 rounded-b-2xl">
                <div className="flex flex-col min-w-0 flex-grow pr-1">
                  <span className="text-[11px] font-medium text-white truncate" title={message.videoName}>
                    {message.videoName}
                  </span>
                  <span className="text-[9px] text-gray-400">
                    {formatBytes(message.videoSize)}
                  </span>
                </div>
                <button
                  onClick={() => downloadFile(message.video, message.videoName)}
                  className="w-7 h-7 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white rounded-lg transition-all flex flex-shrink-0 items-center justify-center border-none"
                  title="Download video"
                >
                  <BsDownload size={11} />
                </button>
              </div>
            </div>
          </div>
        )}
        {message.audio && (
          <VoiceMessagePlayer
            src={message.audio}
            duration={message.audioDuration}
            messageId={message._id}
            fromMe={fromMe}
            formattedTime={formattedTime}
            statusIcon={fromMe ? getStatusIcon() : null}
          />
        )}
        {message.message && (
          <span className={`break-words ${message.isDeletedForEveryone ? "italic opacity-60 font-normal select-none" : ""}`}>
            {message.isDeletedForEveryone ? message.message : renderMessageText(message.message)}
            {message.edited && !message.isDeletedForEveryone && <span className="text-[9px] opacity-60 ml-1.5 select-none font-normal">(edited)</span>}
          </span>
        )}
        {(() => {
          const urlMatch = message.message && !message.isDeletedForEveryone ? message.message.match(URL_REGEX) : null;
          const firstUrl = urlMatch ? urlMatch[0] : null;
          return firstUrl ? <LinkPreview url={firstUrl} /> : null;
        })()}
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
                className={`group/react relative flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] cursor-pointer select-none transition-native ${hasReacted
                    ? "bg-sky-500/20 border border-sky-500/30 text-white"
                    : "bg-slate-800/40 border border-slate-700/30 text-gray-300 hover:bg-slate-700/60"
                  }`}
              >
                <span>{emoji}</span>
                <span className="font-bold">{users.length}</span>

                <div className={`absolute bottom-full mb-1.5 hidden group-hover/react:block bg-slate-950 text-white text-[9px] rounded-lg py-1 px-2.5 whitespace-nowrap z-[100] shadow-2xl border border-slate-800 ${fromMe ? "right-0" : "left-0"}`}>
                  {userNames}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!message.audio && (
        <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
          {formattedTime}
          {fromMe && getStatusIcon()}
        </div>
      )}

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
