"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Bookmark,
  BookmarkCheck,
  Clock,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import mangadexApi, { MangaData, ChapterData } from "@/services/api/mangadex";
import { useBookmarkStore } from "@/store/bookmarks";
import { useReadingHistoryStore } from "@/store/readingHistory";
import { useAuth } from "@/contexts/AuthContext";

interface MangaDetailsData {
  manga: MangaData | null;
  chapters: ChapterData[];
}

export default function MangaDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [mangaDetails, setMangaDetails] = useState<MangaDetailsData>({
    manga: null,
    chapters: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoreChapters, setIsLoadingMoreChapters] = useState(false);
  const [visibleChapters, setVisibleChapters] = useState<ChapterData[]>([]);
  const chaptersPerPage = 25; // Initial number of chapters to show
  const [hasMoreChapters, setHasMoreChapters] = useState(false);
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const { getLastReadChapter } = useReadingHistoryStore();
  const { user } = useAuth();

  // Function to fetch all chapters by making multiple API requests
  const fetchAllChapters = async (mangaId: string) => {
    try {
      setIsLoadingMoreChapters(true);

      // First request to get total count and first batch
      const firstResponse = await mangadexApi.getMangaChapters(mangaId);
      const total = firstResponse.total || 0;

      let allChapters = [...(firstResponse.data || [])];

      // Calculate how many additional requests we need
      const limit = 100; // API limit per request
      const remainingPages = Math.ceil(total / limit) - 1;

      // Make additional requests if needed
      if (remainingPages > 0) {
        const additionalRequests = [];

        for (let i = 1; i <= remainingPages; i++) {
          const offset = i * limit;
          additionalRequests.push(
            mangadexApi.getMangaChapters(mangaId, limit, offset)
          );
        }

        const responses = await Promise.all(additionalRequests);

        // Combine all chapters
        for (const response of responses) {
          if (response.data && response.data.length > 0) {
            allChapters = [...allChapters, ...response.data];
          }
        }
      }

      // Sort chapters by chapter number (descending order)
      const sortedChapters = allChapters.sort(
        (a: ChapterData, b: ChapterData) => {
          const chapterA = parseFloat(a.attributes.chapter || "0");
          const chapterB = parseFloat(b.attributes.chapter || "0");
          return chapterB - chapterA; // Descending order (newest first)
        }
      );

      return sortedChapters;
    } catch (error) {
      console.error("Error fetching all chapters:", error);
      return [];
    } finally {
      setIsLoadingMoreChapters(false);
    }
  };

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setIsLoading(true);

        // Get manga details
        const mangaResponse = await mangadexApi.getMangaById(id);

        // Get all chapters
        const allChapters = await fetchAllChapters(id);

        setMangaDetails({
          manga: mangaResponse.data,
          chapters: allChapters,
        });

        // Set initial visible chapters
        const initialChapters = allChapters.slice(0, chaptersPerPage);
        setVisibleChapters(initialChapters);
        setHasMoreChapters(allChapters.length > chaptersPerPage);
      } catch (error) {
        console.error("Error fetching manga details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchMangaDetails();
    }
  }, [id]);

  const loadMoreChapters = () => {
    const currentCount = visibleChapters.length;
    const nextBatch = mangaDetails.chapters.slice(
      currentCount,
      currentCount + chaptersPerPage
    );

    setVisibleChapters([...visibleChapters, ...nextBatch]);
    setHasMoreChapters(
      currentCount + nextBatch.length < mangaDetails.chapters.length
    );
  };

  const { manga, chapters } = mangaDetails;
  const coverUrl = manga ? mangadexApi.getCoverImageUrl(manga) : null;
  const lastReadChapter = manga ? getLastReadChapter(manga.id) : undefined;

  // Extract info from manga
  const title =
    manga?.attributes.title["en"] ||
    (manga?.attributes.title && Object.values(manga?.attributes.title)[0]) ||
    "Unknown Title";

  const description =
    manga?.attributes.description["en"] ||
    (manga?.attributes.description &&
      Object.values(manga?.attributes.description)[0]) ||
    "No description available.";

  const toggleBookmark = () => {
    if (!manga) return;

    if (isBookmarked(manga.id)) {
      removeBookmark(manga.id, user);
    } else {
      addBookmark(manga, user);
    }
  };

  return (
    <div className="space-y-8">
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
          <Skeleton className="aspect-[2/3] h-auto w-full rounded" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      ) : manga ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[300px_1fr]">
            <div className="relative">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={title}
                  width={300}
                  height={450}
                  className="rounded-lg object-cover shadow-md"
                />
              ) : (
                <div className="flex h-[450px] w-full items-center justify-center rounded-lg bg-muted">
                  <span className="text-muted-foreground">No Cover</span>
                </div>
              )}

              <Button
                onClick={toggleBookmark}
                variant="secondary"
                className="mt-4 w-full"
              >
                {isBookmarked(manga.id) ? (
                  <>
                    <BookmarkCheck className="mr-2 h-5 w-5" />
                    Bookmarked
                  </>
                ) : (
                  <>
                    <Bookmark className="mr-2 h-5 w-5" />
                    Bookmark
                  </>
                )}
              </Button>

              {lastReadChapter && (
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Last read:</span>
                    </div>
                    <Link
                      href={`/manga/${manga.id}/chapter/${lastReadChapter.chapterId}`}
                      className="mt-2 block text-sm font-medium text-primary hover:underline"
                    >
                      Chapter {lastReadChapter.chapterNumber}
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-bold">{title}</h1>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {manga.attributes.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-secondary px-3 py-1 text-xs"
                    >
                      {tag.attributes.name["en"] ||
                        Object.values(tag.attributes.name)[0]}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-muted-foreground">
                  Status:{" "}
                  <span className="capitalize">{manga.attributes.status}</span>
                </p>
              </div>

              <div className="prose prose-sm dark:prose-invert">
                <h3 className="text-lg font-medium">Description</h3>
                <p>{description}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Chapters</h2>
              <p className="text-sm text-muted-foreground">
                {visibleChapters.length} of {chapters.length} chapters
                {isLoadingMoreChapters && (
                  <span className="ml-2">(Loading all chapters...)</span>
                )}
              </p>
            </div>

            {chapters.length === 0 ? (
              <div className="py-4 text-center text-muted-foreground">
                {isLoadingMoreChapters ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="mt-4">Loading all chapters...</p>
                  </div>
                ) : (
                  <p>No chapters available.</p>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {visibleChapters.map((chapter) => (
                    <Link
                      key={chapter.id}
                      href={`/manga/${manga.id}/chapter/${chapter.id}`}
                      className="block"
                    >
                      <div className="rounded-lg border p-3 transition-colors hover:bg-muted/50">
                        <div className="flex justify-between">
                          <h3 className="font-medium">
                            Chapter {chapter.attributes.chapter || "N/A"}
                            {chapter.attributes.title &&
                              ` - ${chapter.attributes.title}`}
                          </h3>
                          <span className="text-sm text-muted-foreground">
                            {new Date(
                              chapter.attributes.publishAt
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {hasMoreChapters && (
                  <div className="flex justify-center py-4">
                    <Button
                      variant="outline"
                      onClick={loadMoreChapters}
                      className="flex items-center gap-2"
                      disabled={isLoadingMoreChapters}
                    >
                      {isLoadingMoreChapters ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4" />
                          Show More Chapters
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-xl font-medium">Manga not found</p>
          <p className="mt-2 text-muted-foreground">
            The manga you&apos;re looking for does not exist or is not
            available.
          </p>
          <Button className="mt-6" asChild>
            <Link href="/">Back to Home</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
