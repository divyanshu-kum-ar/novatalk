import { create } from "zustand";

const useConversation = create((set) => ({
  selectedConversation: null,
  setSelectedConversation: (selectedConversation) =>
    set({ selectedConversation }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  unreadCounts: {},
  setUnreadCounts: (unreadCounts) => set({ unreadCounts }),
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  editingMessage: null,
  setEditingMessage: (editingMessage) => set({ editingMessage }),
  replyingTo: null,
  setReplyingTo: (replyingTo) => set({ replyingTo }),
  searchQuery: "",
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  pinnedChatIds: [],
  setPinnedChatIds: (pinnedChatIds) => set({ pinnedChatIds }),
  mutedChatIds: [],
  setMutedChatIds: (mutedChatIds) => set({ mutedChatIds }),
  archivedChatIds: [],
  setArchivedChatIds: (archivedChatIds) => set({ archivedChatIds }),
  viewArchived: false,
  setViewArchived: (viewArchived) => set({ viewArchived }),
  forwardingMessage: null,
  setForwardingMessage: (forwardingMessage) => set({ forwardingMessage }),
  highlightedMessageId: null,
  setHighlightedMessageId: (highlightedMessageId) => set({ highlightedMessageId }),
}));

export default useConversation;
