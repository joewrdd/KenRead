"use client";

import Link from "next/link";
import Image from "next/image";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MangaData } from "@/services/api/mangadex";
import mangadexApi from "@/services/api/mangadex";
import { useBookmarkStore } from "@/store/bookmarks";
import { useAuth } from "@/contexts/AuthContext";

interface MangaCardProps {
  manga: MangaData;
}

export function MangaCard({ manga }: MangaCardProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarkStore();
  const { user } = useAuth();
  const coverUrl = mangadexApi.getCoverImageUrl(manga);

  // Extract the title (preferably English or the first available)
  const title =
    manga.attributes.title["en"] ||
    Object.values(manga.attributes.title)[0] ||
    "Unknown Title";

  function toggleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    try {
      // Make sure we have valid data before proceeding
      if (!manga || !manga.id) {
        console.error("Cannot bookmark: Invalid manga data");
        return;
      }

      // Safely check if the manga is already bookmarked
      if (isBookmarked && typeof isBookmarked === "function") {
        if (isBookmarked(manga.id)) {
          removeBookmark(manga.id, user);
        } else {
          addBookmark(manga, user);
        }
      } else {
        console.error("Bookmark function is undefined or not a function");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
    }
  }

  return (
    <Link href={`/manga/${manga.id}`} className="group">
      <Card className="overflow-hidden border-0 shadow-md transition-all duration-200 hover:shadow-lg">
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-muted">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-secondary/20">
              <span className="text-sm text-muted-foreground">No Cover</span>
            </div>
          )}

          <button
            onClick={toggleBookmark}
            className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-all hover:bg-background"
          >
            {isBookmarked && typeof isBookmarked === "function" && manga?.id ? (
              isBookmarked(manga.id) ? (
                <BookmarkCheck className="h-5 w-5 text-primary" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>

        <CardContent className="p-3">
          <h3 className="line-clamp-2 font-medium leading-tight">{title}</h3>
        </CardContent>
      </Card>
    </Link>
  );
}
