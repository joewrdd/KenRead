"use client";

import { useState, useEffect } from "react";
import mangadexApi, { MangaData } from "@/services/api/mangadex";
import { MangaCard } from "@/components/ui/MangaCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function PopularPage() {
  const [popularManga, setPopularManga] = useState<MangaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 24;

  const fetchManga = async (currentOffset: number) => {
    try {
      setIsLoading(true);
      const response = await mangadexApi.getTrendingManga(limit, currentOffset);

      if (response.data && response.data.length > 0) {
        if (currentOffset === 0) {
          setPopularManga(response.data);
        } else {
          setPopularManga((prev) => [...prev, ...response.data]);
        }
        setHasMore(response.data.length === limit);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching popular manga:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManga(0);
  }, []);

  const handleLoadMore = () => {
    const newOffset = offset + limit;
    setOffset(newOffset);
    fetchManga(newOffset);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Popular Manga</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {popularManga.map((manga) => (
          <MangaCard key={manga.id} manga={manga} />
        ))}

        {isLoading &&
          Array.from({ length: limit }).map((_, index) => (
            <div key={`skeleton-${index}`} className="space-y-3">
              <Skeleton className="aspect-[2/3] w-full rounded" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
      </div>

      {popularManga.length === 0 && !isLoading && (
        <div className="py-12 text-center">
          <p className="text-xl font-medium">No manga found</p>
          <p className="mt-2 text-muted-foreground">Please try again later.</p>
        </div>
      )}

      {hasMore && (
        <div className="mt-8 flex justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handleLoadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
