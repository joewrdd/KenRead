"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBookmarkStore } from "@/store/bookmarks";
import { useReadingHistoryStore } from "@/store/readingHistory";

export function UserDataLoader() {
  const { user } = useAuth();
  const { loadBookmarks, clearStore: clearBookmarkStore } = useBookmarkStore();
  const { loadHistory, clearStore: clearHistoryStore } =
    useReadingHistoryStore();

  useEffect(() => {
    // When auth state changes, load user data if user is logged in
    const loadUserData = async () => {
      if (user) {
        console.log("Loading user data for:", user.email);
        try {
          // Clear stores first to ensure no data from previous users remains
          clearBookmarkStore();
          clearHistoryStore();

          // Then load from Firebase
          await Promise.all([loadBookmarks(user), loadHistory(user)]);
        } catch (error) {
          console.error("Error loading user data:", error);
          // We don't throw the error so the app can continue to function
          // The individual stores will have their own error states
        }
      }
    };

    loadUserData();
  }, [user, loadBookmarks, loadHistory, clearBookmarkStore, clearHistoryStore]);

  // This is a utility component, it doesn't render anything
  return null;
}
