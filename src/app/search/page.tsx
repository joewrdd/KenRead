"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import mangadexApi, { MangaData } from "@/services/api/mangadex";
import { MangaCard } from "@/components/ui/MangaCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [searchResults, setSearchResults] = useState<MangaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await mangadexApi.searchManga(query);
        setSearchResults(response.data || []);
      } catch (error) {
        console.error("Error searching manga:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {query ? `Search results for "${query}"` : "Search"}
      </h1>

      {!query && (
        <p className="text-muted-foreground">
          Enter a search term in the search box above to find manga.
        </p>
      )}

      {query && isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="aspect-[2/3] w-full rounded" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
        </div>
      ) : query && searchResults.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-xl font-medium">No results found</p>
          <p className="mt-2 text-muted-foreground">
            Try a different search term or check your spelling.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {searchResults.map((manga) => (
            <MangaCard key={manga.id} manga={manga} />
          ))}
        </div>
      )}
    </div>
  );
}
