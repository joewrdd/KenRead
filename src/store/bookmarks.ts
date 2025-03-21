import { create } from "zustand";
import { persist, PersistStorage } from "zustand/middleware";
import { MangaData } from "@/services/api/mangadex";
import {
  addBookmark,
  removeBookmark,
  getBookmarks,
} from "@/services/firebase/userService";
import { User } from "firebase/auth";

interface BookmarkState {
  bookmarks: MangaData[];
  bookmarkedIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  loadBookmarks: (user: User | null) => Promise<void>;
  addBookmark: (manga: MangaData, user: User | null) => Promise<void>;
  removeBookmark: (mangaId: string, user: User | null) => Promise<void>;
  isBookmarked: (mangaId: string) => boolean;
  clearStore: () => void;
}

// Use a simpler approach to handle Set serialization
const customStorage: PersistStorage<BookmarkState> = {
  getItem: (name) => {
    try {
      const storedState = localStorage.getItem(name);
      if (!storedState) return null;

      const parsed = JSON.parse(storedState);
      return {
        ...parsed,
        state: {
          ...parsed.state,
          // Convert serialized array back to Set
          bookmarkedIds: new Set(parsed.state.bookmarkedIds || []),
        },
      };
    } catch (error) {
      console.error("Error getting data from storage:", error);
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      const { state, ...rest } = value;
      const serializedValue = {
        ...rest,
        state: {
          ...state,
          // Convert Set to Array for serialization
          bookmarkedIds: Array.from(state.bookmarkedIds || []),
        },
      };
      localStorage.setItem(name, JSON.stringify(serializedValue));
    } catch (error) {
      console.error("Error setting data to storage:", error);
    }
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
  },
};

export const useBookmarkStore = create<BookmarkState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      bookmarkedIds: new Set<string>(),
      isLoading: false,
      error: null,

      loadBookmarks: async (user) => {
        if (!user) {
          return;
        }

        try {
          set({ isLoading: true, error: null });
          const bookmarkIds = await getBookmarks(user.uid);

          // Update the bookmarkedIds Set
          set({
            bookmarkedIds: new Set(bookmarkIds),
            isLoading: false,
          });
        } catch (error) {
          console.error("Error loading bookmarks:", error);
          set({
            error: "Failed to load bookmarks",
            isLoading: false,
          });
        }
      },

      addBookmark: async (manga, user) => {
        try {
          const { bookmarks, bookmarkedIds } = get();

          // Ensure bookmarkedIds is a Set
          const bookmarkedIdsSet =
            bookmarkedIds instanceof Set ? bookmarkedIds : new Set<string>();

          // Don't add if already bookmarked
          if (bookmarkedIdsSet.has(manga.id)) {
            return;
          }

          // Update local state immediately for better UX
          const newBookmarkedIds = new Set(bookmarkedIdsSet);
          newBookmarkedIds.add(manga.id);

          set({
            bookmarks: [manga, ...bookmarks],
            bookmarkedIds: newBookmarkedIds,
          });

          // Then sync with Firebase if user is logged in
          if (user) {
            await addBookmark(user.uid, manga.id);
          }
        } catch (error) {
          console.error("Error adding bookmark:", error);
          set({ error: "Failed to add bookmark" });
        }
      },

      removeBookmark: async (mangaId, user) => {
        try {
          const { bookmarks, bookmarkedIds } = get();

          // Ensure bookmarkedIds is a Set
          const bookmarkedIdsSet =
            bookmarkedIds instanceof Set ? bookmarkedIds : new Set<string>();

          // Don't remove if not bookmarked
          if (!bookmarkedIdsSet.has(mangaId)) {
            return;
          }

          // Update local state immediately for better UX
          const newBookmarkedIds = new Set(bookmarkedIdsSet);
          newBookmarkedIds.delete(mangaId);

          set({
            bookmarks: bookmarks.filter((manga) => manga.id !== mangaId),
            bookmarkedIds: newBookmarkedIds,
          });

          // Then sync with Firebase if user is logged in
          if (user) {
            await removeBookmark(user.uid, mangaId);
          }
        } catch (error) {
          console.error("Error removing bookmark:", error);
          set({ error: "Failed to remove bookmark" });
        }
      },

      isBookmarked: (mangaId) => {
        const { bookmarkedIds } = get();
        // Ensure bookmarkedIds is a Set before calling .has()
        if (!(bookmarkedIds instanceof Set)) {
          return false;
        }
        return bookmarkedIds.has(mangaId);
      },

      clearStore: () => {
        set({
          bookmarks: [],
          bookmarkedIds: new Set<string>(),
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: "kenread-bookmarks",
      storage: customStorage,
    }
  )
);
