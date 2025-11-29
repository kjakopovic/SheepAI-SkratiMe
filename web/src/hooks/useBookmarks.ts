import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ky from 'ky';
import config from '../config';
import { useState, useEffect, useCallback } from 'react';

const API_URL = 'https://9njbc5qvn5.execute-api.eu-central-1.amazonaws.com';
const BOOKMARKS_KEY = 'user_bookmarks';
const BOOKMARKS_EVENT = 'bookmarks_updated';

// Get auth token from localStorage or your auth context
const getAuthToken = (): string | null => {
  return localStorage.getItem('idToken'); // Adjust based on your auth implementation
};

export interface Bookmark {
  id: string;
  title: string;
  summary: string;
  category_id: string;
  picture_url: string;
  bookmarked_at: string;
}

export interface BookmarksResponse {
  bookmarks: Bookmark[];
  count: number;
}

// Fetch all bookmarks for the current user
export const useGetBookmarks = () => {
  return useQuery<BookmarksResponse>({
    queryKey: ['bookmarks'],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      const response = await ky
        .get(`${API_URL}/bookmarks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .json<BookmarksResponse>();

      return response;
    },
    enabled: !!getAuthToken(),
  });
};

// Add a bookmark
export const useAddBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newsId: string) => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      return ky
        .post(`${API_URL}/bookmarks`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          json: {
            news_id: newsId,
          },
        })
        .json();
    },
    onSuccess: () => {
      // Invalidate bookmarks query to refetch
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
};

// Remove a bookmark
export const useRemoveBookmark = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newsId: string) => {
      const token = getAuthToken();
      if (!token) throw new Error('No auth token found');

      return ky
        .delete(`${API_URL}/bookmarks/${newsId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .json();
    },
    onSuccess: () => {
      // Invalidate bookmarks query to refetch
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });
};

// Toggle bookmark (add if not bookmarked, remove if already bookmarked)
export const useToggleBookmark = () => {
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getBookmarks = () => {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  useEffect(() => {
    setBookmarks(getBookmarks());

    const handleUpdate = () => setBookmarks(getBookmarks());

    // Listen for local events (same tab) and storage events (cross-tab)
    window.addEventListener(BOOKMARKS_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(BOOKMARKS_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const isBookmarked = useCallback((articleId: string) => {
    return bookmarks.includes(articleId);
  }, [bookmarks]);

  const toggleBookmark = async (articleId: string) => {
    setIsLoading(true);
    try {
      const current = getBookmarks();
      const updated = current.includes(articleId)
        ? current.filter((id: string) => id !== articleId)
        : [...current, articleId];

      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
      setBookmarks(updated);
      window.dispatchEvent(new Event(BOOKMARKS_EVENT));
    } catch (error) {
      console.error('Failed to toggle bookmark', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    toggleBookmark,
    isBookmarked,
    isLoading,
    bookmarks,
  };
};
