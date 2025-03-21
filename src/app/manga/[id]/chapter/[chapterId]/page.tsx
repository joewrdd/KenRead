"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  Maximize,
  Minimize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import mangadexApi, { MangaData, ChapterData } from "@/services/api/mangadex";
import { useReadingHistoryStore } from "@/store/readingHistory";
import { useAuth } from "@/contexts/AuthContext";

// Define interfaces for vendor-prefixed fullscreen API
interface DocumentWithFullscreen extends Document {
  webkitFullscreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
  msExitFullscreen?: () => Promise<void>;
}

interface ElementWithFullscreen extends HTMLDivElement {
  webkitRequestFullscreen?: () => Promise<void>;
  msRequestFullscreen?: () => Promise<void>;
}

export default function ChapterReaderPage() {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>();
  const router = useRouter();
  const { addToHistory } = useReadingHistoryStore();
  const { user } = useAuth();

  const [manga, setManga] = useState<MangaData | null>(null);
  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [chapterPages, setChapterPages] = useState<string[]>([]);
  const [chaptersNavigation, setChaptersNavigation] = useState<{
    prev: ChapterData | null;
    next: ChapterData | null;
    allChapters: ChapterData[];
  }>({
    prev: null,
    next: null,
    allChapters: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reference to the container element we'll make fullscreen
  const readerContainerRef = useRef<ElementWithFullscreen>(null);

  // Toggle fullscreen function
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!readerContainerRef.current) return;

      if (!isFullscreen) {
        // Request fullscreen
        if (readerContainerRef.current.requestFullscreen) {
          await readerContainerRef.current.requestFullscreen();
        } else if (readerContainerRef.current.webkitRequestFullscreen) {
          await readerContainerRef.current.webkitRequestFullscreen(); // Safari
        } else if (readerContainerRef.current.msRequestFullscreen) {
          await readerContainerRef.current.msRequestFullscreen(); // IE11
        }
        setIsFullscreen(true);
      } else {
        // Exit fullscreen
        const doc = document as DocumentWithFullscreen;
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  }, [isFullscreen]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const doc = document as DocumentWithFullscreen;
      setIsFullscreen(
        doc.fullscreenElement !== null ||
          doc.webkitFullscreenElement !== null ||
          doc.msFullscreenElement !== null
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("msfullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "msfullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Get manga details
        const mangaResponse = await mangadexApi.getMangaById(id);
        const mangaData = mangaResponse.data;
        setManga(mangaData);

        // Get current chapter details
        const chaptersResponse = await mangadexApi.getMangaChapters(id);
        const chaptersData = chaptersResponse.data || [];

        const currentChapter = chaptersData.find(
          (ch: ChapterData) => ch.id === chapterId
        );

        if (!currentChapter) {
          console.error("Chapter not found");
          return;
        }

        setChapter(currentChapter);

        // Sort chapters by chapter number
        const sortedChapters = [...chaptersData].sort(
          (a: ChapterData, b: ChapterData) => {
            const chapterA = parseFloat(a.attributes.chapter || "0");
            const chapterB = parseFloat(b.attributes.chapter || "0");
            return chapterB - chapterA;
          }
        );

        // Find current chapter index
        const currentChapterIndex = sortedChapters.findIndex(
          (ch: ChapterData) => ch.id === chapterId
        );

        // Set prev/next chapters for navigation
        setChaptersNavigation({
          prev:
            currentChapterIndex > 0
              ? sortedChapters[currentChapterIndex - 1]
              : null,
          next:
            currentChapterIndex < sortedChapters.length - 1
              ? sortedChapters[currentChapterIndex + 1]
              : null,
          allChapters: sortedChapters,
        });

        // Get chapter pages
        const pagesResponse = await mangadexApi.getChapterPages(chapterId);

        if (pagesResponse.chapter) {
          const baseUrl = pagesResponse.baseUrl;
          const hash = pagesResponse.chapter.hash;
          const data = pagesResponse.chapter.data;

          const pageUrls = data.map(
            (filename: string) => `${baseUrl}/data/${hash}/${filename}`
          );

          setChapterPages(pageUrls);

          // Add to reading history
          if (mangaData && currentChapter && user) {
            addToHistory(
              {
                mangaId: mangaData.id,
                chapterId: currentChapter.id,
                chapterNumber: currentChapter.attributes.chapter || "Unknown",
                lastReadAt: Date.now(),
                mangaTitle:
                  mangaData.attributes.title["en"] ||
                  Object.values(mangaData.attributes.title)[0] ||
                  "Unknown Manga",
                coverUrl: mangadexApi.getCoverImageUrl(mangaData),
              },
              user
            );
          }
        }
      } catch (error) {
        console.error("Error fetching chapter data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && chapterId) {
      fetchData();
    }
  }, [id, chapterId, addToHistory, user]);

  const navigateToPreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
      window.scrollTo(0, 0);
    }
  };

  const navigateToNextPage = () => {
    if (currentPage < chapterPages.length - 1) {
      setCurrentPage(currentPage + 1);
      window.scrollTo(0, 0);
    } else if (chaptersNavigation.next) {
      router.push(`/manga/${id}/chapter/${chaptersNavigation.next.id}`);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      navigateToPreviousPage();
    } else if (e.key === "ArrowRight") {
      navigateToNextPage();
    } else if (e.key === "f" || e.key === "F") {
      toggleFullscreen();
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    currentPage,
    chapterPages.length,
    chaptersNavigation.next,
    toggleFullscreen,
  ]);

  // Extract manga and chapter info
  const mangaTitle =
    manga?.attributes.title["en"] ||
    (manga?.attributes.title && Object.values(manga.attributes.title)[0]) ||
    "Unknown Manga";

  const chapterNumber = chapter?.attributes.chapter || "Unknown";
  const chapterTitle = chapter?.attributes.title || "";

  return (
    <div
      ref={readerContainerRef}
      className={`relative mx-auto max-w-4xl pb-12 ${
        isFullscreen ? "h-screen overflow-auto bg-background" : ""
      }`}
    >
      <div
        className={`${
          isFullscreen ? "sticky top-0" : "sticky top-14"
        } z-10 mb-4 flex items-center justify-between gap-2 bg-background/80 p-2 backdrop-blur-sm`}
      >
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/manga/${id}`}>
              <Home className="h-4 w-4" />
            </Link>
          </Button>

          <div className="hidden truncate text-sm md:block">
            <span className="font-medium">{mangaTitle}</span>
            <span className="mx-2">-</span>
            <span>
              Ch. {chapterNumber}
              {chapterTitle && ` - ${chapterTitle}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={navigateToPreviousPage}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <span className="text-sm">
            {currentPage + 1} / {chapterPages.length}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={navigateToNextPage}
            disabled={
              currentPage === chapterPages.length - 1 &&
              !chaptersNavigation.next
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Fullscreen button */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" />
            ) : (
              <Maximize className="h-4 w-4" />
            )}
          </Button>

          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Chapters</DrawerTitle>
              </DrawerHeader>
              <div className="max-h-96 overflow-y-auto p-4">
                {chaptersNavigation.allChapters.map((ch: ChapterData) => (
                  <Link
                    key={ch.id}
                    href={`/manga/${id}/chapter/${ch.id}`}
                    className={`block rounded-md p-2 ${
                      ch.id === chapterId
                        ? "bg-primary/10 font-medium text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    Chapter {ch.attributes.chapter || "N/A"}
                    {ch.attributes.title && ` - ${ch.attributes.title}`}
                  </Link>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>

      <div className="mb-4 flex justify-between">
        {chaptersNavigation.prev && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex items-center gap-1"
          >
            <Link href={`/manga/${id}/chapter/${chaptersNavigation.prev.id}`}>
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous Chapter</span>
            </Link>
          </Button>
        )}

        <div className="flex-1" />

        {chaptersNavigation.next && (
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex items-center gap-1"
          >
            <Link href={`/manga/${id}/chapter/${chaptersNavigation.next.id}`}>
              <span className="hidden sm:inline">Next Chapter</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
      </div>

      <div
        className={`${
          isFullscreen
            ? "flex h-[calc(100vh-200px)] justify-center items-center"
            : ""
        }`}
      >
        {isLoading ? (
          <Skeleton className="mx-auto aspect-[2/3] w-full max-w-xl" />
        ) : chapterPages.length > 0 ? (
          <div
            className={`mx-auto w-full max-w-xl cursor-pointer ${
              isFullscreen ? "h-full flex items-center" : ""
            }`}
            onClick={navigateToNextPage}
          >
            <Image
              src={chapterPages[currentPage]}
              alt={`Page ${currentPage + 1}`}
              width={800}
              height={1200}
              className={`mx-auto object-contain ${
                isFullscreen ? "max-h-[calc(100vh-200px)] w-auto" : "w-full"
              }`}
              priority
            />
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="text-xl font-medium">Failed to load chapter pages</p>
            <p className="mt-2 text-muted-foreground">
              Please try again later or choose another chapter.
            </p>
            <Button className="mt-6" asChild>
              <Link href={`/manga/${id}`}>Back to Manga</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-center gap-2 md:gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={navigateToPreviousPage}
          disabled={currentPage === 0}
          className="px-2 sm:px-4"
        >
          <ChevronLeft className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Previous Page</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={toggleFullscreen}
          className="px-2 sm:px-4"
        >
          {isFullscreen ? (
            <>
              <Minimize className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Exit Fullscreen</span>
            </>
          ) : (
            <>
              <Maximize className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Fullscreen</span>
            </>
          )}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={navigateToNextPage}
          disabled={
            currentPage === chapterPages.length - 1 && !chaptersNavigation.next
          }
          className="px-2 sm:px-4"
        >
          <span className="hidden sm:inline">Next Page</span>
          <ChevronRight className="h-4 w-4 sm:ml-2" />
        </Button>
      </div>

      {/* Keyboard shortcuts info */}
      <div className="mt-6 text-center text-xs text-muted-foreground">
        <p>
          Keyboard shortcuts: Arrow Left/Right to navigate pages, F to toggle
          fullscreen
        </p>
      </div>
    </div>
  );
}
