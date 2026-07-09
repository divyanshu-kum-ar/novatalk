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
    <div className="border-r border-slate-500 p-4 flex flex-col">
      <div className="flex items-center gap-2">
        <SearchInput />
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="btn btn-circle bg-sky-500 hover:bg-sky-600 text-white border-none tooltip tooltip-bottom"
          data-tip="Create Group"
          title="Create Group"
        >
          <span className="text-xl font-bold">+</span>
        </button>
      </div>
      <div className="divider px-3"></div>

      {viewArchived && (
        <div className="flex items-center justify-between px-3 py-1 bg-gray-800 text-sky-400 font-semibold rounded text-sm mb-2">
          <span>Archived Chats</span>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-white underline cursor-pointer"
            onClick={() => setViewArchived(false)}
          >
            Go Back
          </button>
        </div>
      )}

      <Conversations />

      <div className="flex justify-between items-center mt-auto pt-2">
        <div className="flex items-center gap-4">
          <LogoutButton />
          <button
            type="button"
            onClick={() => setViewArchived(!viewArchived)}
            className={`tooltip tooltip-top p-1 rounded transition-colors ${viewArchived ? "text-sky-500" : "text-white hover:text-sky-500"}`}
            title={viewArchived ? "Show Active Chats" : "Archived Chats"}
          >
            <BiArchiveIn className="w-6 h-6 cursor-pointer" />
          </button>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/settings" title="App Settings">
            <BiCog className="w-6 h-6 text-white cursor-pointer hover:text-sky-500 transition-colors" />
          </Link>
        </div>
      </div>
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
export default Sidebar;
