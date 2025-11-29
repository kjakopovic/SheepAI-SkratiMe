import { Article, Category } from '@/types';

// Constants for scoring
const CLICK_WEIGHT = 1;
const DECAY_FACTOR = 0.95; // Optional: reduce score over time or per session to keep things fresh

interface UserPreferences {
  categoryScores: Record<string, number>;
}

// Initialize preferences from local storage or default
export const getStoredPreferences = (): UserPreferences => {
  if (typeof window === 'undefined') return { categoryScores: {} };
  const stored = localStorage.getItem('user_preferences');
  return stored ? JSON.parse(stored) : { categoryScores: {} };
};

// Save preferences to local storage
const savePreferences = (prefs: UserPreferences) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user_preferences', JSON.stringify(prefs));
  }
};

/**
 * Updates the user's preference score when they click an article.
 * @param article The article that was clicked
 */
export const trackArticleClick = (article: Article) => {
  const prefs = getStoredPreferences();
  
  // Apply decay to all existing scores to keep preferences fresh
  // This ensures that older interests fade over time as new ones are clicked
  Object.keys(prefs.categoryScores).forEach((key) => {
    prefs.categoryScores[key] = prefs.categoryScores[key] * DECAY_FACTOR;
  });
  
  // If article has multiple categories, boost all of them
  // Assuming article.category is an array of strings based on your types
  const categories = Array.isArray(article.category) ? article.category : [article.category];

  categories.forEach((cat) => {
    const currentScore = prefs.categoryScores[cat] || 0;
    prefs.categoryScores[cat] = currentScore + CLICK_WEIGHT;
  });

  savePreferences(prefs);
};

/**
 * Sorts a list of articles based on the user's category preferences.
 * Articles with categories the user clicks more often will appear first.
 * @param articles The list of articles to sort
 * @returns Sorted list of articles
 */
export const sortArticlesByRelevance = (articles: Article[]): Article[] => {
  const prefs = getStoredPreferences();

  return [...articles].sort((a, b) => {
    const scoreA = calculateArticleScore(a, prefs.categoryScores);
    const scoreB = calculateArticleScore(b, prefs.categoryScores);

    // Sort descending (highest score first)
    return scoreB - scoreA;
  });
};

/**
 * Helper to calculate a score for a single article based on its categories
 */
const calculateArticleScore = (article: Article, scores: Record<string, number>): number => {
  const categories = Array.isArray(article.category) ? article.category : [article.category];
  
  // Sum up scores for all categories this article belongs to
  const totalScore = categories.reduce((sum, cat) => {
    return sum + (scores[cat] || 0);
  }, 0);

  // You could add a base score here (e.g., based on recency)
  // const recencyScore = new Date(article.publishedAt).getTime() / 10000000000;

  return totalScore;
};

/**
 * Optional: Reset preferences
 */
export const resetPreferences = () => {
  localStorage.removeItem('user_preferences');
}