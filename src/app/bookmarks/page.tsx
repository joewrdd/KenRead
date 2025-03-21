"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useBookmarkStore } from "@/store/bookmarks";
import { MangaCard } from "@/components/ui/MangaCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Loader2, RefreshCw, Search, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import mangadexApi from "@/services/api/mangadex";

export default function BookmarksPage() {
  const {
    bookmarks,
    bookmarkedIds,
    removeBookmark,
    isLoading,
    error,
    loadBookmarks,
  } = useBookmarkStore();
  const { user } = useAuth();
  const [mangaList, setMangaList] = useState(bookmarks);
  const [loadingManga, setLoadingManga] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    // If we have bookmarkedIds from Firebase but no manga data yet,
    // we need to fetch the manga details for each bookmarked ID
    const fetchBookmarkedManga = async () => {
      if (!user || bookmarks.length > 0 || bookmarkedIds.size === 0) {
        setMangaList(bookmarks);
        return;
      }

      try {
        setLoadingManga(true);
        const mangaPromises = Array.from(bookmarkedIds).map((id) =>
          mangadexApi
            .getMangaById(id)
            .then((response) => response.data)
            .catch((err) => {
              console.error(`Error fetching manga ${id}:`, err);
              return null;
            })
        );

        const results = await Promise.all(mangaPromises);
        const validResults = results.filter(Boolean);
        setMangaList(validResults);
      } catch (error) {
        console.error("Error fetching bookmarked manga:", error);
      } finally {
        setLoadingManga(false);
      }
    };

    fetchBookmarkedManga();
  }, [user, bookmarks, bookmarkedIds]);

  // Filter manga list based on search term
  const filteredMangaList = searchTerm
    ? mangaList.filter((manga) => {
        const title =
          manga.attributes.title.en ||
          Object.values(manga.attributes.title)[0] ||
          "";
        return title.toLowerCase().includes(searchTerm.toLowerCase());
      })
    : mangaList;

  const handleClearAll = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to remove all bookmarks? This action cannot be undone."
    );
    if (confirmed) {
      for (const manga of mangaList) {
        await removeBookmark(manga.id, user);
      }
    }
  };

  // Function to reset local storage and reload data
  const handleResetStore = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "This will clear local storage and reload your bookmarks from Firebase. Continue?"
    );

    if (confirmed) {
      // Clear the local storage for bookmarks
      localStorage.removeItem("kenread-bookmarks");

      // Reload data from Firebase
      await loadBookmarks(user);

      // Reload the page to ensure clean state
      window.location.reload();
    }
  };

  // Toggle debug mode with keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D for debug mode
      if (e.ctrlKey && e.shiftKey && e.key === "D") {
        setDebugMode((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Show login prompt if user is not logged in
  if (!user) {
    return (
      <div className="container mx-auto py-12 text-center">
        <BookOpen className="mx-auto h-16 w-16 text-primary opacity-50" />
        <p className="mt-4 text-2xl font-medium">
          Sign in to view your bookmarks
        </p>
        <p className="mt-2 text-muted-foreground">
          You need to be logged in to access your bookmarks across devices.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild>
            <Link href="/auth/login">Sign in</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/auth/signup">Create account</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading || loadingManga) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your bookmarks...</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-xl font-medium text-destructive">
          Error loading bookmarks
        </p>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild>
            <Link href="/">Browse Manga</Link>
          </Button>
          <Button variant="outline" onClick={handleResetStore}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Bookmarks Cache
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">My Bookmarks</h1>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookmarks..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {mangaList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive w-full sm:w-auto"
              onClick={handleClearAll}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {mangaList.length === 0 ? (
        <div className="py-12 text-center bg-muted/30 rounded-lg">
          <BookOpen className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
          <p className="mt-4 text-xl font-medium">No bookmarked manga</p>
          <p className="mt-2 text-muted-foreground">
            Bookmark your favorite manga to view them here.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/">Browse Manga</Link>
          </Button>
        </div>
      ) : filteredMangaList.length === 0 ? (
        <div className="py-12 text-center bg-muted/30 rounded-lg">
          <p className="text-xl font-medium">No results found</p>
          <p className="mt-2 text-muted-foreground">
            No manga matches your search term &ldquo;{searchTerm}&rdquo;.
          </p>
          <Button
            className="mt-6"
            variant="outline"
            onClick={() => setSearchTerm("")}
          >
            Clear Search
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredMangaList.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      )}

      {/* Debug button that's only visible in debug mode */}
      {debugMode && (
        <div className="mt-10 border-t pt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetStore}
            className="bg-yellow-100 dark:bg-yellow-900/30"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset Bookmarks Cache
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Ctrl+Shift+D to hide debug controls
          </p>
        </div>
      )}
    </div>
  );
}
