import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import useConversation from "../../zustand/useConversation";
import { useAuthContext } from "../../context/AuthContext";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const ManageGroupModal = ({ isOpen, onClose, group }) => {
  const { authUser } = useAuthContext();
  const { conversations, setConversations, setSelectedConversation } = useConversation();
  const [groupName, setGroupName] = useState("");
  const [groupAvatar, setGroupAvatar] = useState("");
  const [currentParticipants, setCurrentParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && group) {
      setGroupName(group.groupName || "");
      setGroupAvatar(group.groupAvatar || "");
      // Map participants to user objects/IDs
      setCurrentParticipants(group.participants || []);
    }
  }, [isOpen, group]);

  if (!isOpen || !group) return null;

  // Filter users to find who is NOT in the group currently
  const nonMembers = conversations.filter(
    (c) =>
      !c.isGroup &&
      !currentParticipants.some((p) => (p._id || p) === c._id)
  );

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

  const handleRemoveMember = (userId) => {
    // Creator cannot be removed
    const creatorId = group.groupCreator?._id || group.groupCreator;
    if (userId.toString() === creatorId.toString()) {
      return toast.error("Creator cannot be removed from the group");
    }
    setCurrentParticipants(
      currentParticipants.filter((p) => (p._id || p) !== userId)
    );
  };

  const handleAddMember = (user) => {
    if (!currentParticipants.some((p) => (p._id || p) === user._id)) {
      setCurrentParticipants([...currentParticipants, user]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      return toast.error("Group name cannot be empty");
    }

    setLoading(true);
    try {
      const participantIds = currentParticipants.map((p) => p._id || p);
      const res = await fetch(`/api/groups/${group._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          groupName,
          groupAvatar,
          participants: participantIds,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Update conversations list in store
      const updatedConversations = conversations.map((c) =>
        c._id === group._id ? data : c
      );
      setConversations(updatedConversations);
      // Update selected conversation in store
      setSelectedConversation(data);
      toast.success("Group settings updated successfully!");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update group settings");
    } finally {
      setLoading(false);
    }
  };

  const creatorId = group.groupCreator?._id || group.groupCreator;

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
      
      <div className="bg-gray-800 border border-gray-700 w-full max-w-[540px] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/60 backdrop-blur-md">
          <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">Manage Group</h3>
          <button 
            type="button" 
            onClick={onClose} 
            className="text-gray-400 hover:text-white hover:scale-110 text-2xl font-semibold transition-all focus:outline-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Scrollable Body */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 custom-scrollbar">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-2.5 bg-gray-900/30 p-4 rounded-xl border border-gray-700/50">
              <div className="avatar">
                <div className="w-20 h-20 rounded-full ring-2 ring-sky-500 ring-offset-2 ring-offset-gray-800 relative group overflow-hidden bg-gray-700 flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-[1.02]">
                  <img
                    src={groupAvatar || DEFAULT_AVATAR_GENERIC}
                    alt="Group Avatar"
                    className="w-full h-full object-cover"
                  />
                  <label className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-medium opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200">
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
              <span className="text-xs text-gray-400 font-medium">Group Avatar</span>
            </div>

            {/* Group Name Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs md:text-sm font-semibold text-gray-300 tracking-wide uppercase">
                Group Name
              </label>
              <input
                type="text"
                className="w-full input input-bordered h-11 bg-gray-900/50 border-gray-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white rounded-xl placeholder:text-gray-500 transition-all"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
              />
            </div>

            {/* Current Members Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs md:text-sm font-semibold text-gray-300 tracking-wide uppercase">
                Current Members ({currentParticipants.length})
              </label>
              <div className="border border-gray-700/60 rounded-xl bg-gray-950/80 p-2 overflow-y-auto h-[120px] max-h-[120px] custom-scrollbar flex flex-col gap-1">
                {currentParticipants.map((member) => {
                  const memberId = member._id || member;
                  const memberObj = typeof member === "object" ? member : conversations.find((c) => c._id === member);
                  const name = memberObj?.fullName || (memberId === authUser._id ? authUser.fullName : "User");
                  const pic = memberObj?.profilePic || (memberId === authUser._id ? authUser.profilePic : DEFAULT_AVATAR_GENERIC);
                  const isCreator = memberId.toString() === creatorId.toString();

                  return (
                    <div key={memberId} className="flex justify-between items-center p-1.5 hover:bg-gray-800/80 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="avatar">
                          <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden">
                            <img src={pic || DEFAULT_AVATAR_GENERIC} alt={name} className="object-cover w-full h-full" />
                          </div>
                        </div>
                        <span className="text-xs text-gray-200 font-medium">{name} {isCreator && <span className="text-[10px] text-sky-400 font-semibold">(Creator)</span>}</span>
                      </div>
                      {!isCreator && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(memberId)}
                          className="text-red-500 hover:text-red-400 text-xs px-2 py-0.5 rounded hover:bg-red-950 hover:bg-opacity-35 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add Members Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs md:text-sm font-semibold text-gray-300 tracking-wide uppercase">
                Add Members
              </label>
              <div className="border border-gray-700/60 rounded-xl bg-gray-950/80 p-2 overflow-y-auto h-[120px] max-h-[120px] custom-scrollbar flex flex-col gap-1">
                {nonMembers.map((user) => (
                  <div key={user._id} className="flex justify-between items-center p-1.5 hover:bg-gray-800/80 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="avatar">
                        <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden">
                          <img src={user.profilePic || DEFAULT_AVATAR_GENERIC} alt={user.fullName} className="object-cover w-full h-full" />
                        </div>
                      </div>
                      <span className="text-xs text-gray-200 font-medium">{user.fullName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMember(user)}
                      className="text-sky-400 hover:text-sky-300 text-xs px-2 py-0.5 rounded hover:bg-sky-950 hover:bg-opacity-35 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                ))}
                {nonMembers.length === 0 && (
                  <div className="text-center text-xs text-gray-500 py-4 font-medium">No other users to add</div>
                )}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-900/80 border-t border-gray-700 flex justify-between items-center">
            <button
              type="button"
              onClick={onClose}
              className="text-xs md:text-sm font-medium text-gray-400 hover:text-white transition-all flex items-center gap-1.5"
            >
              &larr; Back to Chat
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="btn btn-sm h-9 btn-ghost text-gray-400 hover:text-white rounded-xl px-4 text-xs md:text-sm font-medium transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-sm h-9 bg-sky-500 hover:bg-sky-600 active:scale-95 text-white border-none min-w-[110px] rounded-xl px-5 text-xs md:text-sm font-semibold tracking-wide shadow-lg transition-all"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner loading-xs"></span> : "Update Group"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManageGroupModal;
