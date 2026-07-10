import { useState, useEffect } from "react";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";
import { BsThreeDotsVertical, BsPinAngleFill } from "react-icons/bs";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_MALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2363b3ed'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_FEMALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f687b3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const getDefaultAvatar = (gender) => {
  if (gender === "male") return DEFAULT_AVATAR_MALE;
  if (gender === "female") return DEFAULT_AVATAR_FEMALE;
  return DEFAULT_AVATAR_GENERIC;
};

const Conversation = ({ conversation, lastIdx, emoji }) => {
  const { selectedConversation, setSelectedConversation, unreadCounts, pinnedChatIds, setPinnedChatIds, mutedChatIds, setMutedChatIds, archivedChatIds, setArchivedChatIds } = useConversation();

  const isSelected = selectedConversation?._id === conversation._id;

  const { onlineUsers } = useSocketContext();
  const isGroup = conversation.isGroup;
  const isOnline = isGroup ? false : (conversation.hideOnline ? false : onlineUsers.includes(conversation._id));
  const isPinned = pinnedChatIds.includes(conversation._id);
  const isMuted = (mutedChatIds || []).includes(conversation._id);
  const isArchived = (archivedChatIds || []).includes(conversation._id);
  const [draftText, setDraftText] = useState("");

  useEffect(() => {
    const checkDraft = () => {
      const draftKey = `novatalk_draft_${conversation._id}`;
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.text?.trim() || parsed.replyTo) {
          setDraftText(parsed.text || "[Reply draft]");
          return;
        }
      }
      setDraftText("");
    };

    checkDraft();

    window.addEventListener("novatalk_drafts_updated", checkDraft);
    return () => {
      window.removeEventListener("novatalk_drafts_updated", checkDraft);
    };
  }, [conversation._id]);

  const handleTogglePin = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/users/pin/${conversation._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPinnedChatIds(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleMute = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/users/mute/${conversation._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setMutedChatIds(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleArchive = async (e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/users/archive/${conversation._id}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setArchivedChatIds(data);
    } catch (err) {
      console.error(err);
    }
  };

  const profilePicSrc = isGroup
    ? (conversation.groupAvatar && conversation.groupAvatar !== "" ? conversation.groupAvatar : DEFAULT_AVATAR_GENERIC)
    : ((conversation.profilePic && !conversation.profilePic.includes("avatar.iran.liara.run"))
      ? conversation.profilePic
      : getDefaultAvatar(conversation.gender));

  const unreadCount = unreadCounts[conversation._id] || 0;

  return (
    <>
      <div
        className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer group
				${isSelected ? "bg-sky-500" : ""} 
			`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className="w-12 rounded-full bg-slate-700 flex items-center justify-center">
            <img
              src={profilePicSrc}
              alt="user avatar"
              onError={(e) => {
                e.target.src = isGroup ? DEFAULT_AVATAR_GENERIC : getDefaultAvatar(conversation.gender);
              }}
            />
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex gap-3 justify-between items-center">
            <div className="flex flex-col min-w-0 flex-1">
              <p className="font-bold text-gray-200 truncate">{isGroup ? conversation.groupName : conversation.fullName}</p>
              {draftText && (
                <span className="text-[10px] text-red-500 font-semibold tracking-wide mt-0.5 truncate max-w-[150px]">
                  Draft: <span className="text-gray-300 font-normal">{draftText}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPinned && <BsPinAngleFill className="text-yellow-400 rotate-[45deg]" size={14} title="Pinned Chat" />}
              {isMuted && <span className="text-[12px]" title="Muted Chat">🔕</span>}
              {unreadCount > 0 && (
                <span className="badge badge-error badge-sm text-white font-semibold rounded-full px-1.5 min-w-[20px] h-[20px] text-center">
                  {unreadCount}
                </span>
              )}
              <div className="dropdown dropdown-left dropdown-end opacity-0 group-hover:opacity-100 transition-opacity">
                <div tabIndex={0} role="button" onClick={(e) => e.stopPropagation()} className="text-gray-400 hover:text-white cursor-pointer p-1 rounded hover:bg-black hover:bg-opacity-25">
                  <BsThreeDotsVertical size={14} />
                </div>
                <ul tabIndex={0} className="dropdown-content z-20 menu p-1 shadow bg-gray-800 border border-gray-700 rounded-box w-28 text-[10px] text-white">
                  <li>
                    <button type="button" onClick={handleTogglePin} className="hover:bg-gray-700">
                      {isPinned ? "Unpin Chat" : "Pin Chat"}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={handleToggleMute} className="hover:bg-gray-700">
                      {isMuted ? "Unmute Chat" : "Mute Chat"}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={handleToggleArchive} className="hover:bg-gray-700">
                      {isArchived ? "Unarchive Chat" : "Archive Chat"}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!lastIdx && <div className="divider my-0 py-0 h-1" />}
    </>
  );
};
export default Conversation;
