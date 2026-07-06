import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
import { useState } from "react";
import { BsDownload, BsFileEarmarkPdf, BsFileEarmarkWord, BsFileEarmarkText, BsFileEarmarkZip, BsFileEarmark } from "react-icons/bs";

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

const Message = ({ message }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation } = useConversation();
  const [showLightbox, setShowLightbox] = useState(false);
  const fromMe = message.senderId === authUser._id;
  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe
    ? authUser.profilePic
    : selectedConversation?.profilePic;
  const bubbleBgColor = fromMe ? "bg-blue-500" : "";

  const shakeClass = message.shouldShake ? "shake" : "";

  const senderGender = fromMe ? authUser.gender : selectedConversation?.gender;

  const profilePicSrc = (profilePic && !profilePic.includes("avatar.iran.liara.run"))
    ? profilePic
    : getDefaultAvatar(senderGender);

  const getStatusIcon = () => {
    if (message.status === "read") return <span className="text-blue-400 ml-1 font-bold">✓✓</span>;
    if (message.status === "delivered") return <span className="text-gray-400 ml-1 font-bold">✓✓</span>;
    return <span className="text-gray-400 ml-1 font-bold">✓</span>;
  };

  return (
    <div className={`chat ${chatClassName}`}>
      <div className="chat-image avatar">
        <div className="w-10 rounded-full">
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
        className={`chat-bubble text-white ${shakeClass} ${bubbleBgColor} pb-2 flex flex-col gap-1.5`}
      >
        {message.image && (
          <div className="relative cursor-pointer max-w-[240px] overflow-hidden rounded-lg group">
            <img
              src={message.image}
              alt="Shared content"
              className="max-h-48 object-cover rounded-lg group-hover:scale-[1.03] transition-transform duration-200"
              onClick={() => setShowLightbox(true)}
            />
          </div>
        )}
        {message.file && (
          <div className="flex items-center gap-3 p-3 bg-gray-800 border border-gray-700 rounded-lg min-w-[200px] max-w-[280px]">
            <div className="text-blue-400 text-2xl flex-shrink-0">
              {getFileIcon(message.fileName)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-semibold text-white truncate" title={message.fileName}>
                {message.fileName}
              </span>
              <span className="text-xs text-gray-400">
                {formatBytes(message.fileSize)}
              </span>
            </div>
            <button
              onClick={() => downloadFile(message.file, message.fileName)}
              className="p-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg transition-all flex-shrink-0"
              title="Download file"
            >
              <BsDownload size={16} />
            </button>
          </div>
        )}
        {message.message && <span>{message.message}</span>}
      </div>
      <div className="chat-footer opacity-50 text-xs flex gap-1 items-center">
        {formattedTime}
        {fromMe && getStatusIcon()}
      </div>

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
