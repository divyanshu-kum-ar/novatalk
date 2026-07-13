import { useState } from "react";
import { Link } from "react-router-dom";
import { BiUser, BiArchiveIn, BiCog } from "react-icons/bi";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import CreateGroupModal from "./CreateGroupModal";
import useConversation from "../../zustand/useConversation";

const Sidebar = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { viewArchived, setViewArchived } = useConversation();

  return (
    <div className="flex flex-col h-full p-4 w-full">
      {/* App Branding & Actions Header */}
      <div className="flex justify-between items-center mb-3 px-1">
        <h2 className="text-xl font-extrabold text-white tracking-tight bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
          NovaTalk
        </h2>
        <div className="flex items-center gap-2">
          {/* Archived Chats Toggle Button */}
          <button
            type="button"
            onClick={() => setViewArchived(!viewArchived)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg ${
              viewArchived ? "text-sky-500 bg-sky-500/10" : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
            title={viewArchived ? "Show Active Chats" : "Archived Chats"}
            aria-label="Archived Chats"
          >
            <BiArchiveIn className="w-5 h-5 cursor-pointer" />
          </button>
          
          {/* Create Group Button */}
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="w-11 h-11 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/10 font-bold text-lg border-none"
            title="Create Group"
          >
            +
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <SearchInput />
      </div>
      <div className="h-[1px] bg-white/5 my-3.5"></div>

      {viewArchived && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border border-slate-700/30 text-sky-400 font-semibold rounded-xl text-xs mb-2 animate-fadeIn">
          <span>Archived Chats</span>
          <button
            type="button"
            className="text-[10px] text-gray-400 hover:text-white underline cursor-pointer"
            onClick={() => setViewArchived(false)}
          >
            Go Back
          </button>
        </div>
      )}

      <Conversations />

      <div className="flex justify-between items-center mt-auto pt-3 border-t border-white/5 bg-transparent">
        <div className="flex items-center gap-3">
          <LogoutButton />
        </div>
        <div className="flex items-center">
          <Link
            to="/settings"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200"
            title="App Settings"
          >
            <BiCog className="w-5 h-5 cursor-pointer" />
          </Link>
        </div>
      </div>
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
export default Sidebar;
