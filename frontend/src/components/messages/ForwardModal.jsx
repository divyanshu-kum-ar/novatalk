import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import useConversation from "../../zustand/useConversation";
import useForwardMessage from "../../hooks/useForwardMessage";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_MALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2363b3ed'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_FEMALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f687b3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const getDefaultAvatar = (gender) => {
  if (gender === "male") return DEFAULT_AVATAR_MALE;
  if (gender === "female") return DEFAULT_AVATAR_FEMALE;
  return DEFAULT_AVATAR_GENERIC;
};

const ForwardModal = ({ isOpen, onClose, messageToForward }) => {
  const { conversations } = useConversation();
  const { forwardMessage, loading } = useForwardMessage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargets, setSelectedTargets] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedTargets([]);
    }
  }, [isOpen]);

  if (!isOpen || !messageToForward) return null;

  // Filter conversations
  const recentChats = conversations.filter((c) => !c.isGroup);
  const groupChats = conversations.filter((c) => c.isGroup);

  const filteredRecentChats = recentChats.filter((c) =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroupChats = groupChats.filter((c) =>
    c.groupName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleTarget = (id) => {
    if (selectedTargets.includes(id)) {
      setSelectedTargets(selectedTargets.filter((targetId) => targetId !== id));
    } else {
      setSelectedTargets([...selectedTargets, id]);
    }
  };

  const handleForward = async () => {
    if (selectedTargets.length === 0) {
      toast.error("Please select at least one contact or group");
      return;
    }
    const result = await forwardMessage(messageToForward._id, selectedTargets);
    if (result.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4 md:p-6">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2937;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #4b5563;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #6b7280;
        }
      `}</style>

      <div className="bg-gray-800 border border-gray-700 w-full max-w-[500px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/60 backdrop-blur-md">
          <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">Forward Message</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:scale-110 text-2xl font-semibold transition-all focus:outline-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700 bg-gray-900/30">
          <input
            type="text"
            placeholder="Search recent chats or groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full input input-bordered h-10 bg-gray-900/50 border-gray-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl placeholder:text-gray-500 text-sm transition-all"
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar flex flex-col gap-4 max-h-[50vh]">
          {/* Recent Chats Section */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent Chats</h4>
            <div className="flex flex-col gap-1">
              {filteredRecentChats.map((chat) => {
                const isChecked = selectedTargets.includes(chat._id);
                const picSrc = chat.profilePic && !chat.profilePic.includes("avatar.iran.liara.run")
                  ? chat.profilePic
                  : getDefaultAvatar(chat.gender);

                return (
                  <div
                    key={chat._id}
                    onClick={() => handleToggleTarget(chat._id)}
                    className={`flex justify-between items-center p-2 rounded-xl cursor-pointer hover:bg-gray-700/50 transition-colors ${
                      isChecked ? "bg-sky-500/10 border border-sky-500/30" : "border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden">
                          <img
                            src={picSrc}
                            alt={chat.fullName}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.target.src = getDefaultAvatar(chat.gender);
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{chat.fullName}</span>
                        <span className="text-xs text-gray-400">@{chat.username}</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by onClick on wrapper
                      className="checkbox checkbox-sky checkbox-sm rounded-md"
                    />
                  </div>
                );
              })}
              {filteredRecentChats.length === 0 && (
                <div className="text-center text-xs text-gray-500 py-2">No recent chats found</div>
              )}
            </div>
          </div>

          {/* Group Chats Section */}
          <div>
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Group Chats</h4>
            <div className="flex flex-col gap-1">
              {filteredGroupChats.map((group) => {
                const isChecked = selectedTargets.includes(group._id);
                const picSrc = group.groupAvatar || DEFAULT_AVATAR_GENERIC;

                return (
                  <div
                    key={group._id}
                    onClick={() => handleToggleTarget(group._id)}
                    className={`flex justify-between items-center p-2 rounded-xl cursor-pointer hover:bg-gray-700/50 transition-colors ${
                      isChecked ? "bg-sky-500/10 border border-sky-500/30" : "border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-9 h-9 rounded-full bg-slate-700 overflow-hidden">
                          <img
                            src={picSrc}
                            alt={group.groupName}
                            className="object-cover w-full h-full"
                            onError={(e) => {
                              e.target.src = DEFAULT_AVATAR_GENERIC;
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-white">{group.groupName}</span>
                        <span className="text-xs text-gray-400">{group.participants?.length || 0} members</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}} // handled by onClick on wrapper
                      className="checkbox checkbox-sky checkbox-sm rounded-md"
                    />
                  </div>
                );
              })}
              {filteredGroupChats.length === 0 && (
                <div className="text-center text-xs text-gray-500 py-2">No group chats found</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-900/80 border-t border-gray-700 flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {selectedTargets.length} selected
          </span>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm h-9 btn-ghost text-gray-400 hover:text-white rounded-xl px-4 text-xs font-medium transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleForward}
              className="btn btn-sm h-9 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white border-none min-w-[100px] rounded-xl px-5 text-xs font-semibold tracking-wide shadow-lg transition-all"
              disabled={loading || selectedTargets.length === 0}
            >
              {loading ? <span className="loading loading-spinner loading-xs"></span> : "Forward"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
