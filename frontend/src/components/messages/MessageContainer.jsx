import { useSocketContext } from "../../context/SocketContext";
import { useState } from "react";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import useConversation from "./../../zustand/useConversation";
import { useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext";
import ManageGroupModal from "./ManageGroupModal";

const MessageContainer = () => {
  const { authUser } = useAuthContext();
  const { selectedConversation, setSelectedConversation } = useConversation();
  const { socket, onlineUsers } = useSocketContext();
  const [isTyping, setIsTyping] = useState(false);
  const [tick, setTick] = useState(0);
  const [isManageOpen, setIsManageOpen] = useState(false);

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
            {isTyping && (
              <span className="text-xs text-sky-200 animate-pulse font-medium pr-2">
                typing...
              </span>
            )}
          </div>

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
