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
}));

export default useConversation;
