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
  
  // Get category names from IDs
  const articleCategories = article.category.map(catId => {
    const category = CATEGORIES.find(c => c.id === catId);
    return category ? category.name : null;
  }).filter(Boolean);

  return (
    <article
      onClick={onClick}
      className="bg-white rounded-xl p-4 md:p-6 hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col"
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
            {articleCategories.map((catName, index) => (
              <span 
                key={index} 
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-md font-medium"
              >
                {formatCategoryName(catName as string)}
              </span>
            ))}
          </div>

          <p className="text-morplo-gray-700 mb-4 line-clamp-2 leading-relaxed flex-1">
            {article.aiSummary}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs text-morplo-gray-600">Relevance</span>
              <div
                className="px-2 py-1 rounded-md text-xs font-medium"
                style={{
                  color: relevanceColor,
                  backgroundColor: `${relevanceColor}15`,
                }}
              >
                {article.relevanceScore}%
              </div>
            </div>
            <span className="text-sm text-morplo-blue-100">Read more →</span>

          </div>
        </div>
      </div>
    </article>
  )
}
