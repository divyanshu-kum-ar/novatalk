import React from "react";
import {
  FiMessageSquare,
  FiUsers,
  FiSearch,
  FiFile,
  FiBell,
  FiArchive,
  FiStar,
  FiPhoneCall
} from "react-icons/fi";

const illustrations = {
  chats: FiMessageSquare,
  messages: FiMessageSquare,
  groups: FiUsers,
  search: FiSearch,
  files: FiFile,
  notifications: FiBell,
  archive: FiArchive,
  pinned: FiStar,
  calls: FiPhoneCall
};

const EmptyState = ({ type = "chats", title, subtitle, actionText, onAction }) => {
  const IconComponent = illustrations[type] || FiMessageSquare;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-900 bg-opacity-40 backdrop-blur-md rounded-2xl border border-slate-700 max-w-sm mx-auto my-6 space-y-4 shadow-2xl animate-fadeIn">
      <div className="p-4 bg-slate-800 bg-opacity-65 rounded-full border border-slate-650 text-sky-400 shadow-inner">
        <IconComponent className="w-10 h-10 animate-pulse text-sky-400" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-bold text-white tracking-wide uppercase">{title}</h3>
        {subtitle && (
          <p className="text-xs text-gray-400 leading-relaxed max-w-[240px] mx-auto">
            {subtitle}
          </p>
        )}
      </div>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-xs bg-sky-600 hover:bg-sky-500 border-none text-white font-semibold transition-all px-4 rounded-md shadow-md"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
