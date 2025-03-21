"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useReadingHistoryStore } from "@/store/readingHistory";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, Loader2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Image from "next/image";
import mangadexApi from "@/services/api/mangadex";

// Define interfaces for better type safety
interface MangaRelationship {
  id: string;
  type: string;
  attributes?: {
    fileName?: string;
    [key: string]: unknown;
  };
}

interface MangaAttributes {
  title: {
    en?: string;
    [key: string]: string | undefined;
  };
}

interface MangaData {
  id: string;
  attributes: MangaAttributes;
  relationships: MangaRelationship[];
}

// Define the Reading History Item interface to match the store
interface HistoryItemWithDetails {
  id: string;
  chapterId: string;
  timestamp: number;
  manga?: MangaData;
  chapterTitle?: string;
}

export default function ReadingHistoryPage() {
  const {
    history,
    removeFromHistory,
    clearHistory,
    loadHistory,
    isLoading,
    error,
  } = useReadingHistoryStore();
  const { user } = useAuth();
  const [historyWithManga, setHistoryWithManga] = useState<
    HistoryItemWithDetails[]
  >([]);
  const [loadingManga, setLoadingManga] = useState(false);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      if (!user || history.length === 0) {
        setHistoryWithManga([]);
        return;
      }

      try {
        setLoadingManga(true);
        const historyWithDetails = await Promise.all(
          history.map(async (item) => {
            try {
              // Create a base item with the required structure
              const baseItem: HistoryItemWithDetails = {
                id: item.mangaId,
                chapterId: item.chapterId,
                timestamp: item.lastReadAt,
              };

              // Fetch chapter details using the API service instead of direct fetch
              const chapterResponse = await mangadexApi.getChapterById(
                item.chapterId
              );

              // Safely access the data properties with null checks
              if (!chapterResponse?.data?.relationships) {
                console.warn(
                  `Missing data in chapter response for ${item.chapterId}`
                );
                return {
                  ...baseItem,
                  manga: undefined,
                  chapterTitle: `Chapter ${item.chapterNumber || "Unknown"}`,
                };
              }

              // Get relationships from chapter to find manga ID
              const mangaRelationship = chapterResponse.data.relationships.find(
                (rel: { type: string }) =>
                  rel && typeof rel === "object" && rel.type === "manga"
              );

              if (!mangaRelationship || !mangaRelationship.id) {
                console.warn(
                  `No manga relationship found for chapter ${item.chapterId}`
                );
                return {
                  ...baseItem,
                  manga: undefined,
                  chapterTitle:
                    chapterResponse.data.attributes?.title ||
                    `Chapter ${
                      chapterResponse.data.attributes?.chapter ||
                      item.chapterNumber ||
                      "Unknown"
                    }`,
                };
              }

              try {
                // Fetch manga details using the manga ID
                const mangaResponse = await mangadexApi.getMangaById(
                  mangaRelationship.id
                );

                if (!mangaResponse?.data) {
                  throw new Error(
                    `Invalid manga data for ID: ${mangaRelationship.id}`
                  );
                }

                const mangaData = mangaResponse.data;

                return {
                  ...baseItem,
                  manga: mangaData,
                  chapterTitle:
                    chapterResponse.data.attributes?.title ||
                    `Chapter ${
                      chapterResponse.data.attributes?.chapter ||
                      item.chapterNumber ||
                      "Unknown"
                    }`,
                };
              } catch (mangaError) {
                console.error(
                  `Error fetching manga ${mangaRelationship.id}:`,
                  mangaError
                );
                return {
                  ...baseItem,
                  manga: undefined,
                  chapterTitle:
                    chapterResponse.data.attributes?.title ||
                    `Chapter ${
                      chapterResponse.data.attributes?.chapter ||
                      item.chapterNumber ||
                      "Unknown"
                    }`,
                };
              }
            } catch (err) {
              console.error(
                `Error fetching details for history item ${item.chapterId}:`,
                err
              );
              return {
                id: item.mangaId,
                chapterId: item.chapterId,
                timestamp: item.lastReadAt,
                manga: undefined,
              };
            }
          })
        );

        setHistoryWithManga(historyWithDetails);
      } catch (error) {
        console.error("Error fetching manga details for history:", error);
      } finally {
        setLoadingManga(false);
      }
    };

    fetchMangaDetails();
  }, [user, history]);

  // Function to reset local storage and reload data
  const handleResetStore = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      "This will clear local storage and reload your reading history from Firebase. Continue?"
    );

    if (confirmed) {
      // Clear the local storage for reading history
      localStorage.removeItem("kenread-reading-history");

      // Reload data from Firebase
      await loadHistory(user);

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

  const handleClearHistory = () => {
    const confirmed = window.confirm(
      "Are you sure you want to clear your reading history? This action cannot be undone."
    );
    if (confirmed && user) {
      clearHistory(user);
    }
  };

  const handleRemoveItem = (id: string) => {
    if (user) {
      // Check the signature of removeFromHistory function
      // If it expects only two arguments, pass only those
      removeFromHistory(id, user);
    }
  };

  // Show login prompt if user is not logged in
  if (!user) {
    return (
      <div className="container mx-auto py-12 text-center">
        <Clock className="mx-auto h-16 w-16 text-primary opacity-50" />
        <p className="mt-4 text-2xl font-medium">
          Sign in to view your reading history
        </p>
        <p className="mt-2 text-muted-foreground">
          You need to be logged in to access your reading history across
          devices.
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
        <p className="mt-4 text-muted-foreground">
          Loading your reading history...
        </p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-12 text-center">
        <p className="text-xl font-medium text-destructive">
          Error loading reading history
        </p>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <div className="mt-6 flex justify-center gap-4">
          <Button asChild>
            <Link href="/">Browse Manga</Link>
          </Button>
          <Button variant="outline" onClick={handleResetStore}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset History Cache
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Reading History</h1>

        {historyWithManga.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleClearHistory}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {historyWithManga.length === 0 ? (
        <div className="py-12 text-center bg-muted/30 rounded-lg">
          <Clock className="mx-auto h-16 w-16 text-muted-foreground opacity-50" />
          <p className="mt-4 text-xl font-medium">No reading history</p>
          <p className="mt-2 text-muted-foreground">
            Your reading history will appear here as you read manga.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/">Browse Manga</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {historyWithManga.map((item) => (
            <Card
              key={`${item.id}-${item.chapterId}`}
              className="overflow-hidden transition-shadow hover:shadow-md"
            >
              <div className="flex">
                {item.manga && (
                  <div className="relative h-[120px] w-[80px] flex-shrink-0 overflow-hidden rounded-md m-3 border border-muted-foreground/10 shadow-sm">
                    <Link
                      href={`/manga/${item.manga.id}`}
                      className="block h-full group"
                    >
                      <Image
                        src={(() => {
                          try {
                            if (!item.manga || !item.manga.relationships) {
                              console.log(
                                "Missing manga or relationships for item:",
                                item.id
                              );
                              return "/placeholder-cover.png";
                            }

                            const coverRel = item.manga.relationships.find(
                              (rel) => rel && rel.type === "cover_art"
                            );

                            console.log("Manga ID:", item.manga.id);
                            console.log("Cover relationship:", coverRel);

                            if (coverRel) {
                              // First try to use fileName if it exists
                              if (
                                coverRel.attributes &&
                                coverRel.attributes.fileName
                              ) {
                                const url = `https://uploads.mangadex.org/covers/${item.manga.id}/${coverRel.attributes.fileName}`;
                                console.log(
                                  "Generated URL (using fileName):",
                                  url
                                );
                                return url;
                              }

                              // Fall back to using ID with .256.jpg suffix
                              if (coverRel.id) {
                                const url = `https://uploads.mangadex.org/covers/${item.manga.id}/${coverRel.id}.256.jpg`;
                                console.log("Generated URL (using ID):", url);
                                return url;
                              }
                            }

                            console.log("No valid cover relationship found");
                            return "/placeholder-cover.png";
                          } catch (error) {
                            console.error("Error generating cover URL:", error);
                            return "/placeholder-cover.png";
                          }
                        })()}
                        alt={(() => {
                          try {
                            if (
                              !item.manga ||
                              !item.manga.attributes ||
                              !item.manga.attributes.title
                            ) {
                              return "Manga cover";
                            }

                            const titles = item.manga.attributes.title;
                            if (!titles) return "Manga cover";

                            return (
                              titles.en ||
                              Object.values(titles).find((v) => !!v) ||
                              "Manga cover"
                            );
                          } catch (error) {
                            console.error("Error generating alt text:", error);
                            return "Manga cover";
                          }
                        })()}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                  </div>
                )}

                <div className="flex flex-1 flex-col py-2 pr-3">
                  <CardHeader className="p-0 pb-2">
                    <CardTitle className="line-clamp-1 text-lg">
                      {item.manga &&
                      item.manga.attributes &&
                      item.manga.attributes.title ? (
                        <Link
                          href={`/manga/${item.manga.id}`}
                          className="hover:underline"
                        >
                          {item.manga.attributes.title.en ||
                            Object.values(item.manga.attributes.title).find(
                              (v) => !!v
                            ) ||
                            "Unknown Manga"}
                        </Link>
                      ) : (
                        "Unknown Manga"
                      )}
                    </CardTitle>
                    <CardDescription className="flex items-center text-xs mt-1">
                      <Clock className="mr-1 h-3 w-3" />
                      {format(new Date(item.timestamp), "PPP p")}
                    </CardDescription>
                  </CardHeader>

                  <div className="pb-2">
                    <p className="text-sm font-medium">
                      {item.chapterTitle ? (
                        <Link
                          href={`/manga/${item.id}/chapter/${item.chapterId}`}
                          className="hover:underline text-primary/90"
                        >
                          {item.chapterTitle}
                        </Link>
                      ) : (
                        `Chapter ID: ${item.chapterId}`
                      )}
                    </p>
                  </div>

                  <div className="mt-auto flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:text-destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
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
            Reset History Cache
          </Button>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Ctrl+Shift+D to hide debug controls
          </p>
        </div>
      )}
    </div>
  );
}
