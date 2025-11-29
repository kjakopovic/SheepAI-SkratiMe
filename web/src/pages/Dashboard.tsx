import React, { useState, useEffect, useRef } from 'react'
import { LayoutGrid, LayoutList, Bookmark } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import config from '../config'
import { SimpleHeader } from '../components/ui/simple-header'
import { TopicFilter } from '../components/ui/topic-filter'
import { ArticleCard } from '../components/ui/article-card'
import { ArticleDetail } from '../components/ui/article-detail'
import { mockArticles } from '../data/mock-data'
import { Article, Category } from '../types'
import { sortArticlesByRelevance, trackArticleClick } from '../lib/relevance-alorithm'
import { useToggleBookmark } from '../hooks/useBookmarks'
import { CATEGORIES } from '../data/categories'

interface DashboardProps {
  onSettingsClick: () => void
}
// eslint-disable-next-line react/function-component-definition
export function Dashboard({ onSettingsClick }: DashboardProps) {
  const navigate = useNavigate()
  const dataFetchedRef = useRef(false)
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [showPodcastModal, setShowPodcastModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const { bookmarks } = useToggleBookmark()

  const categories: Category[] = CATEGORIES
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('idToken')
    if (!token) {
      navigate('/login')
      return
    }

    // Prevent double-fetching in Strict Mode or on quick remounts
    if (dataFetchedRef.current) return
    dataFetchedRef.current = true

    const fetchNews = async () => {
      try {
        const token = localStorage.getItem('idToken')
        console.log(token)
        const response = await fetch('https://1zt5usufzc.execute-api.eu-central-1.amazonaws.com/prod/news', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })



        const data = await response.json()
        console.log(data.items);
        const mappedArticles: Article[] = data.items.map((item: any) => ({
          id: item.id,
          title: item.title,
          source: 'SkratiMe',
          sourceUrl: '#',
          publishedAt: new Date().toISOString(),
          category: [item.category_id],
          aiSummary: item.summary,
          relevanceScore: Math.floor(Math.random() * 20) + 80,
          credibilityScore: 95,
          biasLabel: 'Center',
          uncertaintyLevel: 0,
          consumed: false,
          scrollDepth: 0,
          hasAudio: false,
          content: item.summary,
          imageUrl: item.picture_url,
        }))
        setArticles(mappedArticles)
      } catch (error) {
        console.error('Error fetching news:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [navigate])

  useEffect(() => {
    const now = new Date()
    const hours = now.getHours()
    // Check if time is between 7:00 and 7:59
    if (hours === 16) {
      setShowPodcastModal(true)
    }
  }, [])

  const handlePlayPodcast = async () => {
    if (isPlaying && audio) {
      audio.pause()
      setIsPlaying(false)
      return
    }

    if (audio) {
      audio.play()
      setIsPlaying(true)
      return
    }

    try {
      // Check user email before calling API
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.email !== 'mikulec.marin52@gmail.com' || user.email !== 'hi@leonard.solutions') {
          console.log('User not authorized for TTS API');
          return;
        }
      } else {
        console.log('No user found in local storage');
        return;
      }

      const text = "Good morning! Here is your daily cybersecurity briefing. Major data breaches were reported in the retail sector, and a new zero-day vulnerability affects popular cloud services."


      // WARNING: Exposing API keys on the client side is a security risk.
      // Ensure you restrict this key in Google Cloud Console to your domain.
      const apiKey = import.meta.env.VITE_GOOGLE_TTS_API_KEY;

      if (!apiKey) {
        console.error("Google TTS API Key is missing. Please add VITE_GOOGLE_TTS_API_KEY to your .env file.");
        return;
      }

      const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: 'en-US',
            name: 'en-US-Chirp-HD-D'
          },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });

      const data = await response.json();

      if (data.audioContent) {
        const newAudio = new Audio(`data:audio/mp3;base64,${data.audioContent}`)
        newAudio.onended = () => setIsPlaying(false)
        setAudio(newAudio)
        newAudio.play()
        setIsPlaying(true)
      } else {
        console.error('No audio content received from Google TTS', data);
      }
    } catch (error) {
      console.error('Failed to play podcast:', error)
    }
  }

  const handleToggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.some((c) => c.id === category.id)
        ? prev.filter((c) => c.id !== category.id)
        : [...prev, category],
    )
  }

  // Filter articles first
  const filteredArticles = articles.filter((article) => {
    if (showBookmarksOnly && !bookmarks.includes(article.id)) return false
    if (selectedCategories.length === 0) return true
    return article.category.some((articleCatId) =>
      selectedCategories.some((selectedCat) => selectedCat.id === articleCatId),
    )
  })

  // Then sort them by relevance score
  const sortedArticles = sortArticlesByRelevance(filteredArticles)

  return (
    <div className="min-h-screen bg-morplo-gray-130 flex flex-col">

      <div className='md:fixed top-0 left-0 right-0'>
        <SimpleHeader />
      </div>


      <div className="flex-1 flex flex-col md:flex-row overflow-hidden ">
        <div className='md:h-screen md:fixed top-18'>
          <TopicFilter
            categories={categories}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
          />
        </div>

        <main className="flex-1 overflow-y-auto scrollbar-thin md:mt-14 md:ml-72">
          <div className="w-full py-6 px-4 md:py-12 md:px-6">
            <div className="flex justify-end mb-6 gap-3">
              <button
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
                className={`px-3 py-2 rounded-lg border border-gray-200 flex items-center gap-2 transition-all shadow-sm ${showBookmarksOnly
                    ? 'bg-morplo-blue-100 text-white border-morplo-blue-100'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
              >
                <Bookmark size={18} className={showBookmarksOnly ? 'fill-current' : ''} />
                <span className="text-sm font-medium hidden md:inline">Saved</span>
              </button>

              <div className="bg-white p-1 rounded-lg border border-gray-200 flex gap-1 shadow-sm">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list'
                    ? 'bg-gray-100 text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title="List view"
                >
                  <LayoutList size={20} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid'
                    ? 'bg-gray-100 text-blue-600 shadow-sm'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  title="Grid view"
                >
                  <LayoutGrid size={20} />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morplo-blue-100 mb-4"></div>
                <p className="text-morplo-gray-500 animate-pulse">Curating your feed...</p>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="bg-white rounded-xl p-8 md:p-16 text-center">
                <p className="text-lg text-[var(--text-secondary)] mb-2">
                  No articles found
                </p>
                <p className="text-sm text-morplo-gray-500">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className={
                viewMode === 'list'
                  ? 'space-y-4 md:space-y-6'
                  : 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6'
              } >
                {sortedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    viewMode={viewMode}
                    onClick={() => {
                      trackArticleClick(article)
                      setSelectedArticle(article)

                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {selectedArticle && (
        <ArticleDetail
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}

      {showPodcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setShowPodcastModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-50 text-morplo-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                  <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Good Morning! ☀️
              </h2>
              <p className="text-gray-600 mt-2">
                Here is an overview of what happened while you were away.
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 flex items-center gap-4 border border-gray-100">
              <button
                onClick={handlePlayPodcast}
                className="w-12 h-12 bg-morplo-blue-100 hover:opacity-90 text-white rounded-full flex items-center justify-center transition-colors flex-shrink-0 pl-1 cursor-pointer"
              >
                {isPlaying ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                    className="-ml-1" // Center the pause icon
                  >
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    stroke="none"
                  >
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </button>
              <div className="flex-1">
                <div className="font-medium text-gray-900">Daily Briefing</div>
                <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  {isPlaying ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-morplo-blue-100 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-morplo-blue-100"></span>
                      </span>
                      Playing now...
                    </>
                  ) : (
                    'AI-Generated Audio Summary'
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPodcastModal(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
