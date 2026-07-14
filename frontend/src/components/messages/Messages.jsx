import { useEffect, useRef } from "react";
import useGetMessages from "../../hooks/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import Message from "./Message";
import EmptyState from "../EmptyState";
import useConversation from "../../zustand/useConversation";

const Messages = () => {
  const { messages, loading } = useGetMessages();
  const { highlightedMessageId, setHighlightedMessageId } = useConversation();
  const lastMessageRef = useRef();

  useEffect(() => {
    if (highlightedMessageId) {
      const element = document.getElementById(`msg-${highlightedMessageId}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 150);
        const timer = setTimeout(() => {
          setHighlightedMessageId(null);
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      setTimeout(() => {
        lastMessageRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, highlightedMessageId]);

  return (
    <div className="px-4 md:px-6 flex-1 overflow-auto py-3 no-scrollbar">
      {!loading &&
        messages.length > 0 &&
        messages.map((message, idx) => {
          const nextMessage = messages[idx + 1];

          // Check if same sender
          const currentSender = typeof message.senderId === "object" && message.senderId !== null ? message.senderId._id : message.senderId;
          const nextSender = nextMessage && typeof nextMessage.senderId === "object" && nextMessage.senderId !== null ? nextMessage.senderId._id : (nextMessage ? nextMessage.senderId : null);
          const isSameSender = nextMessage && String(currentSender) === String(nextSender);

          // Check if close in time (within 3 minutes)
          const isCloseInTime = nextMessage && (Math.abs(new Date(message.createdAt) - new Date(nextMessage.createdAt)) <= 3 * 60 * 1000);

          // Exclude special messages (system/call logs) from bubble grouping
          const isNextInGroup = isSameSender && isCloseInTime && !message.isSystem && !nextMessage.isSystem && !message.isCallLog && !nextMessage.isCallLog;
          const isLastInGroup = !isNextInGroup;

          return (
            <div
              key={message._id}
              ref={idx === messages.length - 1 ? lastMessageRef : null}
              className={isNextInGroup ? "mb-1.5" : "mb-4"}
            >
              <Message message={message} isLastInGroup={isLastInGroup} />
            </div>
          );
        })}

      {loading && [...Array(3)].map((_, idx) => <MessageSkeleton key={idx} />)}
      {!loading && messages.length === 0 && (
        <EmptyState
          type="messages"
          title="No messages yet"
          subtitle="Send the first message."
        />
      )}
    </div>
  );
};
export default Messages;
