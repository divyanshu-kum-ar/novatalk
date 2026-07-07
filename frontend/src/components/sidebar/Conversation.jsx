import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_MALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2363b3ed'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_FEMALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f687b3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const getDefaultAvatar = (gender) => {
  if (gender === "male") return DEFAULT_AVATAR_MALE;
  if (gender === "female") return DEFAULT_AVATAR_FEMALE;
  return DEFAULT_AVATAR_GENERIC;
};

const Conversation = ({ conversation, lastIdx, emoji }) => {
  const { selectedConversation, setSelectedConversation, unreadCounts } = useConversation();

  const isSelected = selectedConversation?._id === conversation._id; // it is used to make the selected user on sidebar background as blue

  const { onlineUsers } = useSocketContext();
  const isGroup = conversation.isGroup;
  const isOnline = isGroup ? false : onlineUsers.includes(conversation._id);

  const profilePicSrc = isGroup
    ? (conversation.groupAvatar && conversation.groupAvatar !== "" ? conversation.groupAvatar : DEFAULT_AVATAR_GENERIC)
    : ((conversation.profilePic && !conversation.profilePic.includes("avatar.iran.liara.run"))
      ? conversation.profilePic
      : getDefaultAvatar(conversation.gender));

  const unreadCount = unreadCounts[conversation._id] || 0;

  return (
    <>
      <div
        className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer
				${isSelected ? "bg-sky-500" : ""} 
			`}
        // it is used to make the selected user on sidebar background as blue
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

        <div className="flex flex-col flex-1">
          <div className="flex gap-3 justify-between items-center">
            <p className="font-bold text-gray-200">{isGroup ? conversation.groupName : conversation.fullName}</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <span className="badge badge-error badge-sm text-white font-semibold rounded-full px-1.5 min-w-[20px] h-[20px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!lastIdx && <div className="divider my-0 py-0 h-1" />}
    </>
  );
};
export default Conversation;
