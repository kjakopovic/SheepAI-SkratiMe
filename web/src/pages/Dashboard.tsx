import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { SimpleHeader } from '../components/ui/simple-header'
import { TopicFilter } from '../components/ui/topic-filter'
import { ArticleCard } from '../components/ui/article-card'
import { ArticleDetail } from '../components/ui/article-detail'
import { mockArticles } from '../data/mock-data'
import { Article, Category } from '../types'
import { sortArticlesByRelevance, trackArticleClick } from '../lib/relevance-alorithm'
import { exportToNotion} from '@/services/notion'

interface DashboardProps {
  onSettingsClick: () => void
}
// eslint-disable-next-line react/function-component-definition
export function Dashboard({ onSettingsClick }: DashboardProps) {
  const navigate = useNavigate()
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [showPodcastModal, setShowPodcastModal] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null)

  const categories: Category[] = [
    'cyber-security',
    'data-breaches',
    'malware-alerts',
    'vulnerability-reports',
    'privacy-updates',
    'cloud-security',
    'devsecops-news',
    'software-patches',
    'threat-intel',
    'network-security',
  ];

  useEffect(() => {
    const token = localStorage.getItem('idToken')
    if (!token) {
      navigate('/login')
    }
  }, [])

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
        if (user.email !== 'mikulec.marin52@gmail.com' || user.email !== 'hi@leaonard.solutions') {
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
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    )
  }

  // Filter articles first
  const filteredArticles = mockArticles.filter((article) => {
    if (selectedCategories.length === 0) return true
    return article.category.some((cat) =>
      selectedCategories.includes(cat as Category),
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

        <main className="flex-1 overflow-y-auto scrollbar-thin md:mt-14">
          <div className="max-w-4xl mx-auto py-6 px-4 md:py-12 md:px-6">
            {sortedArticles.length === 0 ? (
              <div className="bg-white rounded-xl p-8 md:p-16 text-center">
                <p className="text-lg text-[var(--text-secondary)] mb-2">
                  No articles found
                </p>
                <p className="text-sm text-morplo-gray-500">
                  Try adjusting your filters
                </p>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6">
                {sortedArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
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
