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
        className={`flex gap-3 items-center rounded-2xl p-2.5 mx-1 my-0.5 cursor-pointer transition-native group select-none ${
          isSelected
            ? "bg-sky-500 text-white shadow-lg shadow-sky-500/10"
            : "hover:bg-slate-800/40 text-gray-300 active:bg-slate-800/60"
        }`}
        onClick={() => setSelectedConversation(conversation)}
      >
        <div className={`avatar ${isOnline ? "online" : ""}`}>
          <div className="w-11 h-11 rounded-full bg-slate-800 flex items-center justify-center ring-2 ring-white/5 overflow-hidden">
            <img
              src={profilePicSrc}
              alt="user avatar"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = isGroup ? DEFAULT_AVATAR_GENERIC : getDefaultAvatar(conversation.gender);
              }}
            />
          </div>
        </div>

        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex gap-3 justify-between items-center">
            <div className="flex flex-col min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-100 truncate group-hover:text-white">
                {isGroup ? conversation.groupName : conversation.fullName}
              </p>
              {draftText && (
                <span className="text-[10px] text-red-400 font-semibold tracking-wide mt-0.5 truncate max-w-[170px]">
                  Draft: <span className="text-gray-400 font-normal">{draftText}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPinned && <BsPinAngleFill className="text-yellow-400 rotate-[45deg]" size={13} title="Pinned Chat" />}
              {isMuted && <span className="text-[11px]" title="Muted Chat">🔕</span>}
              {unreadCount > 0 && (
                <span className="badge bg-red-500 text-white border-none text-[10px] font-bold rounded-full h-4.5 min-w-[18px] px-1 shadow-sm">
                  {unreadCount}
                </span>
              )}
              <div className="dropdown dropdown-left dropdown-end opacity-0 group-hover:opacity-100 transition-opacity">
                <div
                  tabIndex={0}
                  role="button"
                  onClick={(e) => e.stopPropagation()}
                  className="text-gray-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-black/25"
                >
                  <BsThreeDotsVertical size={13} />
                </div>
                <ul tabIndex={0} className="dropdown-content z-20 menu p-1 shadow-xl bg-slate-900 border border-slate-700/80 rounded-xl w-28 text-[10px] text-white">
                  <li>
                    <button type="button" onClick={handleTogglePin} className="hover:bg-slate-800 py-1.5 rounded-lg">
                      {isPinned ? "Unpin Chat" : "Pin Chat"}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={handleToggleMute} className="hover:bg-slate-800 py-1.5 rounded-lg">
                      {isMuted ? "Unmute Chat" : "Mute Chat"}
                    </button>
                  </li>
                  <li>
                    <button type="button" onClick={handleToggleArchive} className="hover:bg-slate-800 py-1.5 rounded-lg">
                      {isArchived ? "Unarchive Chat" : "Archive Chat"}
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {!lastIdx && <div className="h-[1px] bg-white/5 mx-4 my-1" />}
    </>
  );
};
export default Conversation;
