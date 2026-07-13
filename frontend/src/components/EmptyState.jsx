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
    <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-950/25 border border-white/5 rounded-3xl max-w-sm mx-auto my-6 space-y-4 shadow-xl animate-fadeIn">
      <div className="p-4 bg-slate-800/40 rounded-full border border-white/5 text-sky-400 shadow-inner">
        <IconComponent className="w-8 h-8 text-sky-400" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-xs font-bold text-white tracking-wide uppercase">{title}</h3>
        {subtitle && (
          <p className="text-[11px] text-gray-400 leading-relaxed max-w-[220px] mx-auto">
            {subtitle}
          </p>
        )}
      </div>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn btn-xs h-8 bg-sky-500 hover:bg-sky-600 active:scale-95 border-none text-white font-semibold transition-all px-4 rounded-xl shadow-md"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
