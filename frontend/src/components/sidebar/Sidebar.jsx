import { Link } from "react-router-dom";
import { BiUser } from "react-icons/bi";
import Conversations from "./Conversations";
import LogoutButton from "./LogoutButton";
import SearchInput from "./SearchInput";

const Sidebar = () => {
  return (
    <div className="border-r border-slate-500 p-4 flex flex-col">
      <SearchInput />
      <div className="divider px-3"></div>
      <Conversations />
      <div className="flex justify-between items-center mt-auto">
        <LogoutButton />
        <Link to="/profile" title="Profile Settings">
          <BiUser className="w-6 h-6 text-white cursor-pointer hover:text-sky-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
};
export default Sidebar;
