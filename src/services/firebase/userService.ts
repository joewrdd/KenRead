import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase-client";

// User reading history interface
export interface ReadingHistoryItem {
  mangaId: string;
  chapterId: string;
  chapterNumber: string;
  lastReadAt: number;
  mangaTitle: string;
  coverUrl: string | null;
}

// Initialize user data in Firestore when a new user signs up
export async function initializeUserData(userId: string) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await setDoc(userRef, {
      bookmarks: [],
      readingHistory: [],
      createdAt: Date.now(),
    });
  }
}

// Ensure user document exists
async function ensureUserDocExists(userId: string) {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await initializeUserData(userId);
    return false;
  }

  return true;
}

// Bookmarks
export async function getBookmarks(userId: string): Promise<string[]> {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await initializeUserData(userId);
    return [];
  }

  return userDoc.data().bookmarks || [];
}

export async function addBookmark(userId: string, mangaId: string) {
  const userRef = doc(db, "users", userId);

  // Ensure the user document exists first
  await ensureUserDocExists(userId);

  // Now safely update the document
  await updateDoc(userRef, {
    bookmarks: arrayUnion(mangaId),
  });
}

export async function removeBookmark(userId: string, mangaId: string) {
  const userRef = doc(db, "users", userId);

  // Ensure the user document exists first
  const exists = await ensureUserDocExists(userId);

  // Only remove if the document exists
  if (exists) {
    await updateDoc(userRef, {
      bookmarks: arrayRemove(mangaId),
    });
  }
}

// Reading History
export async function getReadingHistory(
  userId: string
): Promise<ReadingHistoryItem[]> {
  const userRef = doc(db, "users", userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    await initializeUserData(userId);
    return [];
  }

  return userDoc.data().readingHistory || [];
}

export async function addToReadingHistory(
  userId: string,
  historyItem: Omit<ReadingHistoryItem, "lastReadAt">
) {
  const userRef = doc(db, "users", userId);

  // Ensure the user document exists
  await ensureUserDocExists(userId);

  const fullHistoryItem = {
    ...historyItem,
    lastReadAt: Date.now(),
  };

  const currentHistory = (await getReadingHistory(userId)) || [];
  const existingIndex = currentHistory.findIndex(
    (item) => item.mangaId === historyItem.mangaId
  );

  let updatedHistory;

  if (existingIndex !== -1) {
    // Update existing entry
    updatedHistory = [...currentHistory];
    updatedHistory[existingIndex] = fullHistoryItem;
  } else {
    // Add new entry at the beginning, limit to 50 entries
    updatedHistory = [fullHistoryItem, ...currentHistory].slice(0, 50);
  }

  await updateDoc(userRef, {
    readingHistory: updatedHistory,
  });
}

export async function removeFromReadingHistory(
  userId: string,
  mangaId: string
) {
  const userRef = doc(db, "users", userId);

  // Ensure the user document exists
  const exists = await ensureUserDocExists(userId);

  if (exists) {
    const history = await getReadingHistory(userId);
    const updatedHistory = history.filter((item) => item.mangaId !== mangaId);

    await updateDoc(userRef, {
      readingHistory: updatedHistory,
    });
  }
}

export async function clearReadingHistory(userId: string) {
  const userRef = doc(db, "users", userId);

  // Ensure the user document exists
  const exists = await ensureUserDocExists(userId);

  if (exists) {
    await updateDoc(userRef, {
      readingHistory: [],
    });
  }
}
