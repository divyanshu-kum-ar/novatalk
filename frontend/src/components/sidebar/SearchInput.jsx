import { useState, useEffect, useRef } from "react";
import { IoSearchSharp } from "react-icons/io5";
import { BiUser, BiGroup, BiChat, BiMessageDetail } from "react-icons/bi";
import { BsX } from "react-icons/bs";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";

const SearchInput = () => {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [results, setResults] = useState({
    users: [],
    groups: [],
    conversations: [],
    messages: [],
  });
  const [activeIndex, setActiveIndex] = useState(-1);
  const dropdownRef = useRef(null);

  const { setSelectedConversation, setHighlightedMessageId } = useConversation();

  // Debounced search trigger
  useEffect(() => {
    if (!search.trim()) {
      setResults({ users: [], groups: [], conversations: [], messages: [] });
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        setResults(data);
        setShowDropdown(true);
        setActiveIndex(-1); // Reset index on new search
      } catch (err) {
        toast.error(err.message || "Failed to search");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Build a flat results list for keyboard navigation
  const flatResults = [];
  if (results.users?.length) {
    results.users.forEach((item) => flatResults.push({ type: "user", data: item }));
  }
  if (results.groups?.length) {
    results.groups.forEach((item) => flatResults.push({ type: "group", data: item }));
  }
  if (results.conversations?.length) {
    results.conversations.forEach((item) => flatResults.push({ type: "chat", data: item }));
  }
  if (results.messages?.length) {
    results.messages.forEach((item) => flatResults.push({ type: "message", data: item }));
  }

  const handleSelect = (item) => {
    const { type, data } = item;
    if (type === "user") {
      setSelectedConversation(data);
    } else if (type === "group") {
      setSelectedConversation(data);
    } else if (type === "chat") {
      setSelectedConversation(data);
    } else if (type === "message") {
      setSelectedConversation({
        _id: data.conversationId,
        isGroup: data.conversationName !== "Private Chat",
        fullName: data.conversationName,
        groupName: data.conversationName,
      });
      setHighlightedMessageId(data._id);
    }
    setSearch("");
    setShowDropdown(false);
  };

  const handleKeyDown = (e) => {
    if (!showDropdown || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1 < flatResults.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < flatResults.length) {
        handleSelect(flatResults[activeIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowDropdown(false);
    }
  };

  // Helper to check if a flat result is currently selected/active
  const isItemActive = (type, id) => {
    if (activeIndex < 0 || activeIndex >= flatResults.length) return false;
    const activeItem = flatResults[activeIndex];
    return activeItem.type === type && activeItem.data._id === id;
  };

  const hasResults =
    results.users?.length > 0 ||
    results.groups?.length > 0 ||
    results.conversations?.length > 0 ||
    results.messages?.length > 0;

  return (
    <div className="relative flex-1" ref={dropdownRef}>
      <div className="flex items-center gap-2 relative">
        <input
          type="text"
          placeholder="Search users, chats, groups, messages..."
          className="input input-bordered rounded-full bg-gray-100/10 border-gray-700/80 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-white w-full pr-10 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {search ? (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setResults({ users: [], groups: [], conversations: [], messages: [] });
              setShowDropdown(false);
            }}
            className="absolute right-3 text-gray-400 hover:text-white transition-colors"
          >
            <BsX size={18} />
          </button>
        ) : (
          <IoSearchSharp className="w-5 h-5 text-gray-400 absolute right-3 pointer-events-none" />
        )}
      </div>

      {loading && (
        <div className="absolute left-0 right-0 top-12 z-[100] bg-slate-800/95 border border-slate-700/80 backdrop-blur-lg rounded-2xl shadow-2xl p-4 flex justify-center items-center">
          <span className="loading loading-spinner loading-md text-sky-500"></span>
        </div>
      )}

      {showDropdown && !loading && (
        <div className="absolute left-0 right-0 top-12 z-[100] bg-slate-800/95 border border-slate-700/80 backdrop-blur-lg rounded-2xl shadow-2xl p-3 flex flex-col gap-3 max-h-[380px] overflow-y-auto custom-scrollbar select-none animate-fadeIn">
          {!hasResults ? (
            <div className="text-center text-gray-400 text-xs py-6 font-medium">
              No Results Found
            </div>
          ) : (
            <div className="flex flex-col gap-4 text-left">
              {/* Users Section */}
              {results.users?.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-2 py-0.5 flex items-center gap-1">
                    <BiUser size={12} className="text-sky-400" /> Users
                  </div>
                  {results.users.map((user) => {
                    const active = isItemActive("user", user._id);
                    return (
                      <div
                        key={user._id}
                        onClick={() => handleSelect({ type: "user", data: user })}
                        className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                          active ? "bg-sky-500/20 border border-sky-500/30 text-white font-medium" : "hover:bg-slate-700/50 text-gray-200"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                          <img src={user.profilePic} alt={user.fullName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs truncate">{user.fullName}</span>
                          <span className="text-[10px] text-gray-400 truncate">@{user.username}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Groups Section */}
              {results.groups?.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-2 py-0.5 flex items-center gap-1">
                    <BiGroup size={12} className="text-emerald-400" /> Groups
                  </div>
                  {results.groups.map((group) => {
                    const active = isItemActive("group", group._id);
                    return (
                      <div
                        key={group._id}
                        onClick={() => handleSelect({ type: "group", data: group })}
                        className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                          active ? "bg-sky-500/20 border border-sky-500/30 text-white font-medium" : "hover:bg-slate-700/50 text-gray-200"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                          <img src={group.groupAvatar} alt={group.groupName} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs truncate">{group.groupName}</span>
                          <span className="text-[10px] text-gray-400 truncate">
                            {group.participants?.length || 0} members
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Chats Section */}
              {results.conversations?.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-2 py-0.5 flex items-center gap-1">
                    <BiChat size={12} className="text-purple-400" /> Private Chats
                  </div>
                  {results.conversations.map((conv) => {
                    const active = isItemActive("chat", conv._id);
                    return (
                      <div
                        key={conv._id}
                        onClick={() => handleSelect({ type: "chat", data: conv })}
                        className={`flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-colors ${
                          active ? "bg-sky-500/20 border border-sky-500/30 text-white font-medium" : "hover:bg-slate-700/50 text-gray-200"
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                          <img src={conv.profilePic} alt={conv.fullName} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-xs truncate">{conv.fullName}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Messages Section */}
              {results.messages?.length > 0 && (
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold text-gray-400 tracking-wider uppercase px-2 py-0.5 flex items-center gap-1">
                    <BiMessageDetail size={12} className="text-yellow-400" /> Messages
                  </div>
                  {results.messages.map((msg) => {
                    const active = isItemActive("message", msg._id);
                    return (
                      <div
                        key={msg._id}
                        onClick={() => handleSelect({ type: "message", data: msg })}
                        className={`flex flex-col gap-1 p-2 rounded-xl cursor-pointer border border-transparent transition-colors ${
                          active ? "bg-sky-500/20 border-sky-500/30 text-white" : "hover:bg-slate-700/50 text-gray-250"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-5 h-5 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                              <img src={msg.sender.profilePic} alt={msg.sender.fullName} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] font-semibold text-sky-400 truncate">{msg.sender.fullName}</span>
                            <span className="text-[9px] text-gray-500 truncate">in {msg.conversationName}</span>
                          </div>
                          <span className="text-[9px] text-gray-500 flex-shrink-0">
                            {new Date(msg.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 truncate pl-6 italic">"{msg.message}"</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchInput;
