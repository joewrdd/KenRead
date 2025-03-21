import axios from "axios";

const BASE_URL = "https://api.mangadex.org";

// Define types for manga data
export interface MangaData {
  id: string;
  type: string;
  attributes: {
    title: Record<string, string>;
    altTitles: Array<Record<string, string>>;
    description: Record<string, string>;
    status: string;
    tags: Array<{
      id: string;
      type: string;
      attributes: {
        name: Record<string, string>;
      };
    }>;
    contentRating: string;
    createdAt: string;
    updatedAt: string;
    year: number | null;
    availableTranslatedLanguages: string[];
    originalLanguage: string;
  };
  relationships: Array<Relationship>;
}

export interface CoverArtAttributes {
  fileName: string;
  [key: string]: unknown;
}

export interface Relationship {
  id: string;
  type: string;
  attributes?: Record<string, unknown>;
}

export interface ChapterData {
  id: string;
  type: string;
  attributes: {
    title: string;
    volume: string | null;
    chapter: string | null;
    pages: number;
    translatedLanguage: string;
    createdAt: string;
    updatedAt: string;
    publishAt: string;
    readableAt: string;
  };
  relationships: Array<{
    id: string;
    type: string;
  }>;
}

// API client for MangaDex
const mangadexApi = {
  // Get trending manga
  getTrendingManga: async (limit = 20, offset = 0) => {
    try {
      const response = await axios.get(`${BASE_URL}/manga`, {
        params: {
          limit,
          offset,
          includes: ["cover_art", "author", "artist"],
          order: {
            followedCount: "desc",
          },
          contentRating: ["safe", "suggestive", "erotica"],
          availableTranslatedLanguage: ["en"],
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching trending manga:", error);
      throw error;
    }
  },

  // Get latest manga updates
  getLatestManga: async (limit = 20, offset = 0) => {
    try {
      const response = await axios.get(`${BASE_URL}/manga`, {
        params: {
          limit,
          offset,
          includes: ["cover_art", "author", "artist"],
          order: {
            updatedAt: "desc",
          },
          contentRating: ["safe", "suggestive", "erotica"],
          availableTranslatedLanguage: ["en"],
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching latest manga:", error);
      throw error;
    }
  },

  // Search manga by title
  searchManga: async (query: string, limit = 20, offset = 0) => {
    try {
      const response = await axios.get(`${BASE_URL}/manga`, {
        params: {
          title: query,
          limit,
          offset,
          includes: ["cover_art", "author", "artist"],
          contentRating: ["safe", "suggestive", "erotica"],
          availableTranslatedLanguage: ["en"],
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching manga:", error);
      throw error;
    }
  },

  // Get manga details by ID
  getMangaById: async (mangaId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/manga/${mangaId}`, {
        params: {
          includes: ["cover_art", "author", "artist"],
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching manga details for ID ${mangaId}:`, error);
      throw error;
    }
  },

  // Get chapters for a manga
  getMangaChapters: async (mangaId: string, limit = 100, offset = 0) => {
    try {
      const response = await axios.get(`${BASE_URL}/manga/${mangaId}/feed`, {
        params: {
          limit,
          offset,
          translatedLanguage: ["en"],
          order: {
            chapter: "desc",
          },
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching chapters for manga ID ${mangaId}:`, error);
      throw error;
    }
  },

  // Get chapter pages
  getChapterPages: async (chapterId: string) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/at-home/server/${chapterId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching pages for chapter ID ${chapterId}:`, error);
      throw error;
    }
  },

  // Get chapter details by ID
  getChapterById: async (chapterId: string) => {
    try {
      const response = await axios.get(`${BASE_URL}/chapter/${chapterId}`);
      return response.data;
    } catch (error) {
      console.error(
        `Error fetching chapter details for ID ${chapterId}:`,
        error
      );
      // Rethrow with a more descriptive message
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Failed to fetch chapter: ${error.response.status} ${error.response.statusText}`
        );
      }
      throw new Error(`Failed to fetch chapter: ${error}`);
    }
  },

  // Helper function to get the cover image URL for a manga
  getCoverImageUrl: (manga: MangaData): string | null => {
    try {
      if (!manga || !manga.relationships) return null;

      const coverArt = manga.relationships.find(
        (rel) => rel && rel.type === "cover_art"
      );

      if (!coverArt || !coverArt.attributes) {
        return null;
      }

      // Handle the 'fileName' property safely
      const fileName = coverArt.attributes["fileName"];
      if (typeof fileName !== "string") {
        return null;
      }

      return `https://uploads.mangadex.org/covers/${manga.id}/${fileName}`;
    } catch (error) {
      console.error("Error getting cover image URL:", error);
      return null;
    }
  },
};

export default mangadexApi;
