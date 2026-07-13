import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from "../../context/AuthContext";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { authUser } = useAuthContext();
  const { conversations, setConversations, setSelectedConversation } = useConversation();
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter individual users out from conversations to choose as members
  const availableUsers = conversations.filter((c) => !c.isGroup);

  useEffect(() => {
    if (isOpen) {
      setGroupName("");
      setGroupAvatar("");
      setSelectedMembers([]);
    }
  }, [isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupAvatar(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleToggleMember = (userId) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter((id) => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return toast.error("Group name is required");
    }
    if (selectedMembers.length === 0) {
      return toast.error("Please select at least one member");
    }

    setLoading(true);
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName,
          groupAvatar,
          participants: selectedMembers,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Prepend to conversations list
      setConversations([data, ...conversations]);
      // Select the new group conversation
      setSelectedConversation(data);
      toast.success("Group created successfully!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/5 w-full max-w-[480px] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-fadeIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-slate-950/40 backdrop-blur-md">
          <h3 className="text-md md:text-lg font-bold text-white tracking-wide">Create New Group</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-white hover:scale-110 text-xl font-semibold transition-all focus:outline-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4 no-scrollbar">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-2 bg-slate-950/30 p-4 rounded-2xl border border-white/5">
              <div className="avatar">
                <div className="w-16 h-16 rounded-full ring-2 ring-sky-500 ring-offset-2 ring-offset-slate-900 relative group overflow-hidden bg-slate-800 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-[1.02]">
                  <img
                    src={groupAvatar || DEFAULT_AVATAR_GENERIC}
                    alt="Group Avatar"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
                    Upload
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">Add a group icon (optional)</span>
            </div>

            {/* Group Name Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                Group Name
              </label>
              <input
                type="text"
                placeholder="e.g. Design Sync"
                className="w-full input input-bordered h-10 bg-slate-800/60 border-slate-700/50 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl placeholder:text-gray-500 text-xs transition-all"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>

            {/* Select Members Section */}
            <div className="flex flex-col gap-1.5 flex-1 min-h-[160px]">
              <label className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-1">
                Select Members
              </label>
              <div className="border border-white/5 rounded-2xl bg-slate-950/40 p-2 overflow-y-auto h-[160px] max-h-[160px] no-scrollbar flex flex-col gap-1">
                {availableUsers.map((user) => (
                  <label
                    key={user._id}
                    className="flex items-center gap-3 p-2 hover:bg-slate-800/40 active:bg-slate-800/60 rounded-xl cursor-pointer transition-colors duration-150"
                  >
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary checkbox-xs border-gray-500 focus:ring-sky-500 rounded-md"
                      checked={selectedMembers.includes(user._id)}
                      onChange={() => handleToggleMember(user._id)}
                    />
                    <div className="avatar">
                      <div className="w-7 h-7 rounded-full bg-slate-700 overflow-hidden">
                        <img src={user.profilePic || DEFAULT_AVATAR_GENERIC} alt={user.fullName} className="object-cover w-full h-full" />
                      </div>
                    </div>
                    <span className="text-xs text-gray-200 font-medium tracking-wide">{user.fullName}</span>
                  </label>
                ))}
                {availableUsers.length === 0 && (
                  <div className="text-center text-xs text-gray-500 py-8 font-medium">No members available to add</div>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950/40 border-t border-white/5 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-medium text-gray-400 hover:text-white transition-all flex items-center gap-1"
            >
              &larr; Back
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm h-8 btn-ghost text-gray-400 hover:text-white rounded-lg px-3 text-xs font-medium transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm h-8 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white border-none min-w-[90px] rounded-lg px-4 text-xs font-semibold tracking-wide shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-xs"></span> : "Create Group"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
