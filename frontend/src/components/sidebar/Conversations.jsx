import { useEffect } from "react";
import { getRandomEmoji } from "../../utils/emojis";
import Conversation from "./Conversation";
import useGetConversations from "./../../hooks/useGetConversations";
import useConversation from "../../zustand/useConversation";

const Conversations = () => {
  // here conversations are the users to show at the sidebar
  const { loading, conversations } = useGetConversations();
  const { selectedConversation, unreadCounts, setUnreadCounts } = useConversation();

  useEffect(() => {
    if (selectedConversation && unreadCounts[selectedConversation._id]) {
      const updatedCounts = { ...unreadCounts };
      delete updatedCounts[selectedConversation._id];
      setUnreadCounts(updatedCounts);
    }
  }, [selectedConversation, unreadCounts, setUnreadCounts]);

  return (
    <div className="py-2 flex flex-col overflow-auto">
      {conversations.map((conversation, idx) => (
        <Conversation
          key={conversation._id}
          conversation={conversation}
          emoji={getRandomEmoji()}
          lastIdx={idx === conversations.length - 1}
        />
      ))}

      {loading ? (
        <span className="loading loading-spinner mx-auto"></span>
      ) : null}
    </div>
  );
};
export default Conversations;
