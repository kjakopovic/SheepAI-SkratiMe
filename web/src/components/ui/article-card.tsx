import React from 'react'
import { CheckCircleIcon, Bookmark } from 'lucide-react'
import { Article } from '../../types'
import { cn } from '../../lib/utils'
import { useToggleBookmark } from '../../hooks/useBookmarks'
import { CATEGORIES } from '../../data/categories'

interface ArticleCardProps {
  article: Article
  onClick: () => void
  viewMode?: 'list' | 'grid'
}

export function ArticleCard({
  article,
  onClick,
  viewMode = 'list',
}: ArticleCardProps) {
  const { toggleBookmark, isBookmarked, isLoading } = useToggleBookmark()
  const bookmarked = isBookmarked(article.id)

  const getRelevanceColor = (score: number) => {
    if (score >= 85) return 'var(--color-morplo-green-100)'
    if (score >= 70) return 'var(--color-morplo-yellow-400)'
    return 'var(--color-morplo-gray-600)'
  }
  const relevanceColor = getRelevanceColor(article.relevanceScore)

  const formatCategoryName = (name: string) => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
  
  const CARD_COLORS: Record<string, string> = {
    'breaking-news': 'bg-red-50 hover:bg-red-100/80 border-red-100',
    'malware-alerts': 'bg-orange-50 hover:bg-orange-100/80 border-orange-100',
    'vulnerability-reports': 'bg-yellow-50 hover:bg-yellow-100/80 border-yellow-100',
    'cyber-security': 'bg-blue-50 hover:bg-blue-100/80 border-blue-100',
    'cloud-security': 'bg-sky-50 hover:bg-sky-100/80 border-sky-100',
    'network-security': 'bg-indigo-50 hover:bg-indigo-100/80 border-indigo-100',
    'privacy-updates': 'bg-purple-50 hover:bg-purple-100/80 border-purple-100',
    'threat-intel': 'bg-slate-50 hover:bg-slate-100/80 border-slate-100',
    'devsecops-news': 'bg-emerald-50 hover:bg-emerald-100/80 border-emerald-100',
    'software-patches': 'bg-green-50 hover:bg-green-100/80 border-green-100',
    'default': 'bg-white hover:shadow-md border-transparent'
  };

  // Get category names from IDs
  const articleCategories = article.category.map(catId => {
    const category = CATEGORIES.find(c => c.id === catId);
    return category ? category.name : null;
  }).filter(Boolean);

  const primaryCategory = articleCategories[0] as string;
  const cardStyle = CARD_COLORS[primaryCategory] || CARD_COLORS['default'];

  return (
    <article
      onClick={onClick}
      className={cn(
        "rounded-xl p-4 md:p-6 transition-all cursor-pointer h-full flex flex-col border",
        cardStyle
      )}
    >
      <div
        className={cn(
          'flex flex-col gap-4',
          viewMode === 'list' ? 'md:flex-row md:gap-6' : 'gap-4',
        )}
      >
        {article.imageUrl && (
          <div
            className={cn(
              'rounded-lg overflow-hidden flex-shrink-0',
              viewMode === 'list'
                ? 'w-full h-48 md:w-48 md:h-32'
                : 'w-full h-48',
            )}
          >
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold text-morplo-gray-900 line-clamp-2 leading-snug">
              {article.title}
            </h3>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  void toggleBookmark(article.id)
                }}
                disabled={isLoading}
                className="text-morplo-gray-400 hover:text-morplo-blue-100 transition-colors"
              >
                <Bookmark
                  className={cn(
                    'w-5 h-5',
                    bookmarked && 'fill-current text-morplo-blue-100',
                  )}
                />
              </button>
              {article.consumed && (
                <CheckCircleIcon className="w-5 h-5 text-morplo-green-100 flex-shrink-0" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3 text-sm text-morplo-gray-700">
            <span>{article.source}</span>
            <span>•</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>
          
          {/* Categories */}
          <div className="flex flex-wrap gap-2 mb-3">
            {articleCategories.map((catName, index) => {
              return (
                <span 
                  key={index} 
                  className="px-2 py-0.5 text-xs rounded-md font-medium bg-white/60 border border-black/5 text-gray-700"
                >
                  {formatCategoryName(catName as string)}
                </span>
              );
            })}
          </div>

          <p className="text-morplo-gray-700 mb-4 line-clamp-2 leading-relaxed flex-1">
            {article.aiSummary}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <span className="text-sm text-morplo-blue-100">Read more →</span>
          </div>
        </div>
      </div>
    </article>
  )
}
