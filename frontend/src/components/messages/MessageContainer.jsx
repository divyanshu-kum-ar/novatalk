import { useSocketContext } from "../../context/SocketContext";
import { useState } from "react";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import { BsTelephoneFill, BsCameraVideoFill, BsSearch, BsChevronUp, BsChevronDown, BsX, BsThreeDotsVertical, BsArrowLeft } from "react-icons/bs";
import useConversation from "./../../zustand/useConversation";
import useClearChat from "../../hooks/useClearChat";
import { useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import ManageGroupModal from "./ManageGroupModal";
import ForwardModal from "./ForwardModal";
import { useCallContext } from "../../context/CallContext";
import EmptyState from "../EmptyState";
import toast from "react-hot-toast";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_MALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2363b3ed'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_FEMALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f687b3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_GROUP_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'><path d='M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z'/></svg>";

const getDefaultAvatar = (gender) => {
  if (gender === "male") return DEFAULT_AVATAR_MALE;
  if (gender === "female") return DEFAULT_AVATAR_FEMALE;
  return DEFAULT_AVATAR_GENERIC;
};

const MessageContainer = () => {
  const { authUser } = useAuthContext();
  const { selectedConversation, setSelectedConversation, messages, searchQuery, setSearchQuery, forwardingMessage, setForwardingMessage } = useConversation();
  const { socket, onlineUsers } = useSocketContext();
  const { startCall } = useCallContext();
  const [isTyping, setIsTyping] = useState(false);
  const [tick, setTick] = useState(0);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { clearChat, loading: clearing } = useClearChat();
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleBlockUnblock = async () => {
    setBlocking(true);
    const endpoint = selectedConversation.isBlocked ? `/api/users/unblock/${selectedConversation._id}` : `/api/users/block/${selectedConversation._id}`;
    const action = selectedConversation.isBlocked ? "unblocked" : "blocked";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Local state update
      const state = useConversation.getState();
      state.setConversations(
        state.conversations.map((c) => {
          if (c._id === selectedConversation._id) {
            return {
              ...c,
              isBlocked: !selectedConversation.isBlocked,
            };
          }
          return c;
        })
      );
      setSelectedConversation({
        ...selectedConversation,
        isBlocked: !selectedConversation.isBlocked,
      });

      toast.success(`User ${action} successfully!`);
      setShowBlockConfirm(false);
    } catch (err) {
      toast.error(err.message || `Failed to ${action} user`);
    } finally {
      setBlocking(false);
    }
  };

  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [matchingIds, setMatchingIds] = useState([]);
  const [currentMatchIdx, setCurrentMatchIdx] = useState(-1);

  const closeSearch = () => {
    setShowSearchBar(false);
    setSearchVal("");
    setSearchQuery("");
    setMatchingIds([]);
    setCurrentMatchIdx(-1);
  };

  useEffect(() => {
    closeSearch();

    const fetchLatestBio = async () => {
      if (selectedConversation && !selectedConversation.isGroup) {
        try {
          const res = await fetch(`/api/users/${selectedConversation._id}`);
          const data = await res.json();
          if (!data.error) {
            setSelectedConversation({
              ...selectedConversation,
              about: data.about || "",
            });
            const state = useConversation.getState();
            state.setConversations(
              state.conversations.map((c) =>
                c._id === selectedConversation._id ? { ...c, about: data.about || "" } : c
              )
            );
          }
        } catch (err) {
          console.error("Error fetching user profile:", err);
        }
      }
    };

    fetchLatestBio();
  }, [selectedConversation?._id]);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchVal(val);
    setSearchQuery(val);

    if (!val.trim()) {
      setMatchingIds([]);
      setCurrentMatchIdx(-1);
      return;
    }

    const matchesList = messages.filter((msg) => {
      if (msg.isDeletedForEveryone) return false;
      const textMatch = msg.message && msg.message.toLowerCase().includes(val.toLowerCase());
      const fileMatch = msg.fileName && msg.fileName.toLowerCase().includes(val.toLowerCase());
      const captionMatch = msg.caption && msg.caption.toLowerCase().includes(val.toLowerCase());
      return textMatch || fileMatch || captionMatch;
    });

    const ids = matchesList.map((m) => m._id);
    setMatchingIds(ids);
    setCurrentMatchIdx(ids.length > 0 ? 0 : -1);

    if (ids.length > 0) {
      scrollToMessage(ids[0]);
    }
  };

  const scrollToMessage = (id) => {
    setTimeout(() => {
      const element = document.getElementById(`msg-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        const bubble = element.querySelector(".chat-bubble");
        if (bubble) {
          bubble.classList.add("ring-4", "ring-yellow-400", "transition-all", "duration-200");
          setTimeout(() => {
            bubble.classList.remove("ring-4", "ring-yellow-400");
          }, 1500);
        }
      }
    }, 100);
  };

  const handleNextMatch = () => {
    if (matchingIds.length === 0) return;
    const nextIdx = (currentMatchIdx + 1) % matchingIds.length;
    setCurrentMatchIdx(nextIdx);
    scrollToMessage(matchingIds[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (matchingIds.length === 0) return;
    const prevIdx = (currentMatchIdx - 1 + matchingIds.length) % matchingIds.length;
    setCurrentMatchIdx(prevIdx);
    scrollToMessage(matchingIds[prevIdx]);
  };

  const isGroup = selectedConversation?.isGroup;
  const isOnline = !isGroup && selectedConversation && !selectedConversation.hideOnline && onlineUsers.includes(selectedConversation._id);

  const isCreator = isGroup && (
    selectedConversation.groupCreator === authUser._id ||
    selectedConversation.groupCreator?._id === authUser._id
  );

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const timeStr = `${hours}:${minutes} ${ampm}`;

    if (diffMs < 0 || diffSec < 60) {
      return "Last seen just now";
    }
    if (diffMin < 60) {
      return `Last seen ${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    }

    // Check if today
    const isToday = date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    // Check if yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isToday) {
      return `Last seen today at ${timeStr}`;
    }
    if (isYesterday) {
      return `Last seen yesterday at ${timeStr}`;
    }

    // Older than yesterday (e.g. 05 Jul 2026, 7:30 PM)
    const day = String(date.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `Last seen on ${day} ${month} ${year}, ${timeStr}`;
  };

  useEffect(() => {
    // clean up functon that refresh the setSelectedConversation to null if we logOut
    return () => setSelectedConversation(null);
  }, [setSelectedConversation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 15000); // refresh every 15 seconds for accurate relative times
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!socket || !selectedConversation) return;

    const handleTyping = ({ senderId }) => {
      if (senderId === selectedConversation._id) {
        setIsTyping(true);
      }
    };

    const handleStopTyping = ({ senderId }) => {
      if (senderId === selectedConversation._id) {
        setIsTyping(false);
      }
    };

    socket.on("typing", handleTyping);
    socket.on("stopTyping", handleStopTyping);

    // Reset state on conversation change
    setIsTyping(false);

    return () => {
      socket.off("typing", handleTyping);
      socket.off("stopTyping", handleStopTyping);
    };
  }, [socket, selectedConversation]);

  // Define avatar path for header
  const profilePicSrc = selectedConversation
    ? (isGroup
      ? (selectedConversation.groupAvatar && selectedConversation.groupAvatar !== "" ? selectedConversation.groupAvatar : DEFAULT_GROUP_AVATAR)
      : ((selectedConversation.profilePic && !selectedConversation.profilePic.includes("avatar.iran.liara.run"))
        ? selectedConversation.profilePic
        : getDefaultAvatar(selectedConversation.gender)))
    : DEFAULT_AVATAR_GENERIC;

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          {/* Glassmorphic Sticky Header */}
          <div className="sticky top-0 z-30 flex justify-between items-center px-4 py-2.5 bg-slate-900/80 backdrop-blur-md border-b border-white/5 shadow-md">
            <div className="flex items-center gap-2 min-w-0">
              {/* Back Button for mobile */}
              <button
                type="button"
                onClick={() => setSelectedConversation(null)}
                className="md:hidden p-2 -ml-2 text-gray-300 hover:text-white rounded-xl hover:bg-slate-800/60 active:scale-95 transition-all"
                title="Back to Chats"
              >
                <BsArrowLeft className="w-5 h-5" />
              </button>

              {/* Partner/Group Avatar */}
              <div className="avatar cursor-pointer" onClick={() => isGroup && setIsManageOpen(true)}>
                <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden ring-1 ring-white/10">
                  <img
                    src={profilePicSrc}
                    alt="Chat Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = isGroup ? DEFAULT_GROUP_AVATAR : getDefaultAvatar(selectedConversation.gender);
                    }}
                  />
                </div>
              </div>

              {/* Chat details */}
              <div className="flex flex-col min-w-0">
                <span className="text-white font-semibold text-sm truncate flex items-center gap-1.5 cursor-pointer hover:text-sky-400 transition-colors" onClick={() => isGroup && setIsManageOpen(true)}>
                  {isGroup ? selectedConversation.groupName : selectedConversation.fullName}
                </span>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium mt-0.5">
                  {isGroup ? (
                    <span>{selectedConversation.participants?.length || 0} members</span>
                  ) : isOnline ? (
                    <span className="text-green-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block animate-pulse"></span> Online
                    </span>
                  ) : (
                    <span>{formatLastSeen(selectedConversation.lastSeen)}</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isTyping && (
                <span className="text-[11px] text-green-400 animate-pulse font-medium pr-1 select-none">
                  typing...
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowSearchBar(!showSearchBar)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200"
                title="Search Messages"
              >
                <BsSearch size={13} />
              </button>
              {!isGroup && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startCall(selectedConversation._id, selectedConversation.fullName, selectedConversation.profilePic, "voice")}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200"
                    title="Start Voice Call"
                  >
                    <BsTelephoneFill size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => startCall(selectedConversation._id, selectedConversation.fullName, selectedConversation.profilePic, "video")}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200"
                    title="Start Video Call"
                  >
                    <BsCameraVideoFill size={13} />
                  </button>
                </div>
              )}
              {/* Three-dot dropdown menu */}
              <div className="dropdown dropdown-bottom dropdown-end">
                <div tabIndex={0} role="button" className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 text-gray-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer" title="Options">
                  <BsThreeDotsVertical size={14} />
                </div>
                <ul tabIndex={0} className="dropdown-content z-20 menu p-1 shadow-2xl bg-slate-900 border border-slate-700/80 rounded-xl w-36 text-xs text-white mt-1">
                  <li>
                    <button type="button" onClick={() => setShowSearchBar(!showSearchBar)} className="hover:bg-slate-800 py-2 rounded-lg">
                      Search in Chat
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={() => setShowClearConfirm(true)} className="text-red-500 hover:text-red-400 hover:bg-slate-800 py-2 rounded-lg">
                      Clear Chat
                    </button>
                  </li>
                  {!isGroup && (
                    <li>
                      <button
                        type="button"
                        onClick={() => setShowBlockConfirm(true)}
                        className={`${
                          selectedConversation.isBlocked
                            ? "text-green-400 hover:text-green-300"
                            : "text-red-500 hover:text-red-400"
                        } hover:bg-slate-800 py-2 rounded-lg`}
                      >
                        {selectedConversation.isBlocked ? "✅ Unblock User" : "🚫 Block User"}
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>

          {showSearchBar && (
            <div className="bg-slate-800 px-4 py-2 border-b border-gray-700 flex justify-between items-center animate-fade-in z-20 sticky top-0 shadow-md">
              <div className="flex items-center gap-2 flex-grow max-w-md">
                <input
                  type="text"
                  value={searchVal}
                  onChange={handleSearchChange}
                  placeholder="Search messages..."
                  className="bg-gray-700 border border-gray-600 rounded-lg text-xs text-white px-3 py-1.5 w-full focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                {searchVal.trim() && (
                  <span className="text-[10px] text-gray-400 whitespace-nowrap min-w-[65px] text-right">
                    {matchingIds.length > 0 ? `${currentMatchIdx + 1} of ${matchingIds.length}` : "No results"}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2.5 ml-3">
                <button
                  type="button"
                  onClick={handlePrevMatch}
                  disabled={matchingIds.length === 0}
                  className="p-1.5 rounded-full bg-slate-700 text-gray-300 hover:text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Previous match"
                >
                  <BsChevronUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={handleNextMatch}
                  disabled={matchingIds.length === 0}
                  className="p-1.5 rounded-full bg-slate-700 text-gray-300 hover:text-white hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Next match"
                >
                  <BsChevronDown size={12} />
                </button>
                <button
                  type="button"
                  onClick={closeSearch}
                  className="p-1.5 rounded-full bg-slate-700 text-red-400 hover:text-red-300 hover:bg-slate-600 transition-colors"
                  title="Close search"
                >
                  <BsX size={14} />
                </button>
              </div>
            </div>
          )}

          {showSearchBar && matchingIds.length === 0 && searchVal.trim() && (
            <div className="py-4 bg-slate-850">
              <EmptyState
                type="search"
                title="No results found"
                subtitle="Try another keyword."
              />
            </div>
          )}

          <Messages />
          <MessageInput />

          {isGroup && (
            <ManageGroupModal
              isOpen={isManageOpen}
              onClose={() => setIsManageOpen(false)}
              group={selectedConversation}
            />
          )}

          <ForwardModal
            isOpen={!!forwardingMessage}
            onClose={() => setForwardingMessage(null)}
            messageToForward={forwardingMessage}
          />

          {showClearConfirm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 border border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-white">Clear Chat</h3>
                <p className="text-sm text-gray-300">
                  This will remove all messages from this conversation for you.
                </p>
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowClearConfirm(false);
                    }}
                    className="btn btn-sm h-9 btn-ghost text-gray-400 hover:text-white rounded-xl px-4 text-xs font-medium transition-all"
                    disabled={clearing}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      const res = await clearChat(selectedConversation._id);
                      if (res.success) {
                        setShowClearConfirm(false);
                      }
                    }}
                    className="btn btn-sm h-9 bg-red-500 hover:bg-red-600 active:scale-95 text-white border-none rounded-xl px-5 text-xs font-semibold tracking-wide shadow-lg transition-all"
                    disabled={clearing}
                  >
                    {clearing ? <span className="loading loading-spinner loading-xs"></span> : "Clear Chat"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showBlockConfirm && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gray-800 border border-gray-700 w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4">
                <h3 className="text-lg font-bold text-white">
                  {selectedConversation.isBlocked ? "Unblock User" : "Block User"}
                </h3>
                {!selectedConversation.isBlocked && (
                  <p className="text-sm text-gray-300">
                    You won't receive messages or calls from this user until you unblock them.
                  </p>
                )}
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowBlockConfirm(false);
                    }}
                    className="btn btn-sm h-9 btn-ghost text-gray-400 hover:text-white rounded-xl px-4 text-xs font-medium transition-all"
                    disabled={blocking}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await handleBlockUnblock();
                    }}
                    className={`btn btn-sm h-9 ${
                      selectedConversation.isBlocked ? "bg-sky-500 hover:bg-sky-600" : "bg-red-500 hover:bg-red-600"
                    } active:scale-95 text-white border-none rounded-xl px-5 text-xs font-semibold tracking-wide shadow-lg transition-all`}
                    disabled={blocking}
                  >
                    {blocking ? <span className="loading loading-spinner loading-xs"></span> : (selectedConversation.isBlocked ? "Unblock" : "Block")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
export default MessageContainer;

const NoChatSelected = () => {
  const { authUser } = useAuthContext();
  return (
    <div className="flex items-center justify-center w-full h-full p-4">
      <div className="animate-fadeIn">
        <EmptyState
          type="chats"
          title={`Welcome 👋 ${authUser.fullName}`}
          subtitle="Select a chat from the sidebar to start messaging and sharing files."
        />
      </div>
    </div>
  );
};
