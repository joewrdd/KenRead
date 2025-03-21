import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import { User } from "firebase/auth";
import {
  addToReadingHistory,
  removeFromReadingHistory,
  getReadingHistory,
  clearReadingHistory,
} from "@/services/firebase/userService";

export interface ReadingHistoryItem {
  mangaId: string;
  chapterId: string;
  chapterNumber: string;
  lastReadAt: number;
  mangaTitle: string;
  coverUrl: string | null;
}

export interface ReadingHistoryState {
  history: ReadingHistoryItem[];
  isLoading: boolean;
  error: string | null;
  loadHistory: (user: User) => Promise<void>;
  addToHistory: (historyItem: ReadingHistoryItem, user: User) => Promise<void>;
  removeFromHistory: (mangaId: string, user: User) => Promise<void>;
  getLastReadChapter: (mangaId: string) => ReadingHistoryItem | undefined;
  clearHistory: (user: User) => Promise<void>;
  clearStore: () => void;
}

// Custom storage to handle local persistence
const customStorage: PersistStorage<ReadingHistoryState> = {
  getItem: (name) => {
    const str = localStorage.getItem(name);
    if (!str) return null;

    const { state } = JSON.parse(str);
    // No need for special deserialization since we're using arrays
    return { state };
  },
  setItem: (name, value) => {
    // No need for special serialization since we're using arrays
    localStorage.setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useReadingHistoryStore = create<ReadingHistoryState>()(
  persist(
    (set, get) => ({
      history: [],
      isLoading: false,
      error: null,

      loadHistory: async (user: User) => {
        try {
          set({ isLoading: true, error: null });
          const historyData = await getReadingHistory(user.uid);
          set({ history: historyData, isLoading: false });
        } catch (error) {
          console.error("Error loading reading history:", error);
          set({
            isLoading: false,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load reading history",
          });
        }
      },

      addToHistory: async (historyItem: ReadingHistoryItem, user: User) => {
        try {
          // Optimistically update local state first
          const updatedHistory = [...get().history];

          // Check if the manga is already in history
          const existingIndex = updatedHistory.findIndex(
            (item) =>
              item.mangaId === historyItem.mangaId &&
              item.chapterId === historyItem.chapterId
          );

          if (existingIndex !== -1) {
            // Update the existing entry
            updatedHistory[existingIndex] = {
              ...historyItem,
              lastReadAt: Date.now(),
            };
          } else {
            // Add the new entry
            updatedHistory.push({
              ...historyItem,
              lastReadAt: Date.now(),
            });
          }

          // Sort by most recent
          updatedHistory.sort((a, b) => b.lastReadAt - a.lastReadAt);

          // Trim history to last 100 items if needed
          const trimmedHistory = updatedHistory.slice(0, 100);

          set({ history: trimmedHistory });

          // Then update in Firebase
          await addToReadingHistory(user.uid, historyItem);
        } catch (error) {
          console.error("Error adding to reading history:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to add to reading history",
          });
        }
      },

      removeFromHistory: async (mangaId: string, user: User) => {
        try {
          // Optimistically update local state
          const updatedHistory = get().history.filter(
            (item) => item.mangaId !== mangaId
          );
          set({ history: updatedHistory });

          // Then update in Firebase
          await removeFromReadingHistory(user.uid, mangaId);
        } catch (error) {
          console.error("Error removing from reading history:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to remove from reading history",
          });
        }
      },

      getLastReadChapter: (mangaId: string) => {
        return get().history.find((item) => item.mangaId === mangaId);
      },

      clearHistory: async (user: User) => {
        try {
          // Optimistically update local state
          set({ history: [] });

          // Then update in Firebase
          await clearReadingHistory(user.uid);
        } catch (error) {
          console.error("Error clearing reading history:", error);
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to clear reading history",
          });
        }
      },

      clearStore: () => {
        set({ history: [], isLoading: false, error: null });
      },
    }),
    {
      name: "kenread-reading-history",
      storage: customStorage,
    }
  )
);
