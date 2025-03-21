"use client";

import { useState, useEffect } from "react";
import mangadexApi, { MangaData } from "@/services/api/mangadex";
import { MangaCard } from "@/components/ui/MangaCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [trendingManga, setTrendingManga] = useState<MangaData[]>([]);
  const [latestManga, setLatestManga] = useState<MangaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchManga = async () => {
      try {
        setIsLoading(true);
        const [trendingResponse, latestResponse] = await Promise.all([
          mangadexApi.getTrendingManga(),
          mangadexApi.getLatestManga(),
        ]);

        setTrendingManga(trendingResponse.data || []);
        setLatestManga(latestResponse.data || []);
      } catch (error) {
        console.error("Error fetching manga:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManga();
  }, []);

  return (
    <>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-3">KenRead Manga</h1>
        <p className="text-muted-foreground mb-8">
          Discover trending manga and stay updated with the latest releases
        </p>

        <div className="space-y-10">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Trending Manga</h2>
              <Button variant="outline" asChild>
                <a href="/popular">View all</a>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-[2/3] w-full rounded" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {trendingManga.slice(0, 12).map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Latest Updates</h2>
              <Button variant="outline" asChild>
                <a href="/latest">View all</a>
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, index) => (
                  <div key={index} className="space-y-3">
                    <Skeleton className="aspect-[2/3] w-full rounded" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {latestManga.slice(0, 12).map((manga) => (
                  <MangaCard key={manga.id} manga={manga} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
