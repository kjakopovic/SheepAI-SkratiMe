import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ky from 'ky';
import config from '../config';

const API_URL = 'https://9njbc5qvn5.execute-api.eu-central-1.amazonaws.com';

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
  const { data: bookmarks } = useGetBookmarks();
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const isBookmarked = (newsId: string): boolean => {
    return bookmarks?.bookmarks.some((b) => b.id === newsId) ?? false;
  };

  const toggleBookmark = async (newsId: string) => {
    if (isBookmarked(newsId)) {
      await removeBookmark.mutateAsync(newsId);
    } else {
      await addBookmark.mutateAsync(newsId);
    }
  };

  return {
    toggleBookmark,
    isBookmarked,
    isLoading: addBookmark.isPending || removeBookmark.isPending,
  };
};
