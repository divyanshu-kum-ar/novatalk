import { useEffect } from "react";
import { getRandomEmoji } from "../../utils/emojis";
import Conversation from "./Conversation";
import useGetConversations from "./../../hooks/useGetConversations";
import useConversation from "../../zustand/useConversation";

const Conversations = () => {
  const { loading, conversations } = useGetConversations();
  const { selectedConversation, unreadCounts, setUnreadCounts, pinnedChatIds, archivedChatIds, viewArchived } = useConversation();

  useEffect(() => {
    if (selectedConversation && unreadCounts[selectedConversation._id]) {
      const updatedCounts = { ...unreadCounts };
      delete updatedCounts[selectedConversation._id];
      setUnreadCounts(updatedCounts);
    }
  }, [selectedConversation, unreadCounts, setUnreadCounts]);

  const displayedConversations = conversations.filter((conversation) => {
    const isArchived = (archivedChatIds || []).includes(conversation._id);
    return viewArchived ? isArchived : !isArchived;
  });

  const sortedConversations = [...displayedConversations].sort((a, b) => {
    const aPinnedIndex = pinnedChatIds.indexOf(a._id);
    const bPinnedIndex = pinnedChatIds.indexOf(b._id);

    const aIsPinned = aPinnedIndex !== -1;
    const bIsPinned = bPinnedIndex !== -1;

    if (aIsPinned && bIsPinned) {
      return aPinnedIndex - bPinnedIndex;
    }
    if (aIsPinned) return -1;
    if (bIsPinned) return 1;

    return 0;
  });

  return (
    <div className="py-2 flex flex-col overflow-auto">
      {sortedConversations.map((conversation, idx) => (
        <Conversation
          key={conversation._id}
          conversation={conversation}
          emoji={getRandomEmoji()}
          lastIdx={idx === sortedConversations.length - 1}
        />
      ))}

      {loading ? (
        <span className="loading loading-spinner mx-auto"></span>
      ) : null}
    </div>
  );
};
export default Conversations;
