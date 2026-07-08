import { useSocketContext } from "../../context/SocketContext";
import { useState } from "react";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import { BsTelephoneFill, BsCameraVideoFill, BsSearch, BsChevronUp, BsChevronDown, BsX } from "react-icons/bs";
import useConversation from "./../../zustand/useConversation";
import { useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import ManageGroupModal from "./ManageGroupModal";
import { useCallContext } from "../../context/CallContext";

const MessageContainer = () => {
  const { authUser } = useAuthContext();
  const { selectedConversation, setSelectedConversation, messages, searchQuery, setSearchQuery } = useConversation();
  const { socket, onlineUsers } = useSocketContext();
  const { startCall } = useCallContext();
  const [isTyping, setIsTyping] = useState(false);
  const [tick, setTick] = useState(0);
  const [isManageOpen, setIsManageOpen] = useState(false);

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
  }, [selectedConversation]);

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
  const isOnline = !isGroup && selectedConversation && onlineUsers.includes(selectedConversation._id);

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

  return (
    <div className="md:min-w-[450px] flex flex-col">
      {!selectedConversation ? (
        <NoChatSelected />
      ) : (
        <>
          <div className="bg-slate-500 px-4 py-2 mb-2 flex justify-between items-center">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="label-text text-gray-200">To:</span>{" "}
                <span className="text-gray-900 font-bold flex items-center gap-2">
                  {isGroup ? selectedConversation.groupName : selectedConversation.fullName}
                  {isCreator && (
                    <button
                      type="button"
                      onClick={() => setIsManageOpen(true)}
                      className="text-xs bg-slate-700 hover:bg-slate-600 text-white font-semibold px-2 py-0.5 rounded transition-colors"
                      title="Manage Group Settings"
                    >
                      Manage
                    </button>
                  )}
                </span>
              </div>
              <span className="text-[10px] text-gray-200 flex items-center gap-1 font-medium mt-0.5">
                {isGroup ? (
                  <span>{selectedConversation.participants?.length || 0} members</span>
                ) : isOnline ? (
                  <span className="text-green-300 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block animate-pulse"></span> Online
                  </span>
                ) : (
                  <span>{formatLastSeen(selectedConversation.lastSeen)}</span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {isTyping && (
                <span className="text-xs text-sky-200 animate-pulse font-medium pr-1">
                  typing...
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowSearchBar(!showSearchBar)}
                className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all duration-200 shadow-md"
                title="Search Messages"
              >
                <BsSearch size={13} />
              </button>
              {!isGroup && (
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => startCall(selectedConversation._id, selectedConversation.fullName, selectedConversation.profilePic, "voice")}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all duration-200 shadow-md"
                    title="Start Voice Call"
                  >
                    <BsTelephoneFill size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => startCall(selectedConversation._id, selectedConversation.fullName, selectedConversation.profilePic, "video")}
                    className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 hover:scale-105 active:scale-95 text-white flex items-center justify-center transition-all duration-200 shadow-md"
                    title="Start Video Call"
                  >
                    <BsCameraVideoFill size={13} />
                  </button>
                </div>
              )}
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
            <div className="bg-slate-800 text-center py-2 text-xs text-gray-400 border-b border-gray-700 animate-fade-in">
              No results found
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
        </>
      )}
    </div>
  );
};
export default MessageContainer;

const NoChatSelected = () => {
  const { authUser } = useAuthContext();
  return (
    <div className="flex items-center justify-center w-full h-full">
      <div className="px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2">
        <p>Welcome 👋 {authUser.fullName} ❄</p>
        <p>Select a chat to start messaging</p>
        <TiMessages className="text-3xl md:text-6xl text-center" />
      </div>
    </div>
  );
};
