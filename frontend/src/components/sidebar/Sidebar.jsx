import { useState } from "react";
import { Link } from "react-router-dom";
import { BiUser } from "react-icons/bi";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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
      <Conversations />
      <div className="flex justify-between items-center mt-auto">
        <LogoutButton />
        <Link to="/profile" title="Profile Settings">
          <BiUser className="w-6 h-6 text-white cursor-pointer hover:text-sky-500 transition-colors" />
        </Link>
      </div>
      <CreateGroupModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
};
export default Sidebar;
