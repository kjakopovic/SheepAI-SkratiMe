import React from 'react'
import { CheckCircleIcon } from 'lucide-react'
import { Article } from '../../types'
interface ArticleCardProps {
  article: Article
  onClick: () => void
}
export function ArticleCard({ article, onClick }: ArticleCardProps) {
  const getRelevanceColor = (score: number) => {
    if (score >= 85) return 'var(--accent-green)'
    if (score >= 70) return 'var(--accent-amber)'
    return 'var(--text-tertiary)'
  }
  const relevanceColor = getRelevanceColor(article.relevanceScore)
  return (
    <article
      onClick={onClick}
      className="bg-white rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex gap-6">
        {article.imageUrl && (
          <div className="w-40 h-28 rounded-lg overflow-hidden flex-shrink-0">
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4 mb-2">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
              {article.title}
            </h3>
            {article.consumed && (
              <CheckCircleIcon className="w-5 h-5 text-[var(--accent-green)] flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 mb-3 text-sm text-[var(--text-secondary)]">
            <span>{article.source}</span>
            <span>•</span>
            <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
          </div>
          <p className="text-[var(--text-secondary)] mb-4 line-clamp-2 leading-relaxed">
            {article.aiSummary}
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-tertiary)]">
                Relevance
              </span>
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
            <span className="text-sm text-[var(--accent-blue)]">
              Read more →
            </span>
          </div>
        </div>
      </div>
    </article>
  )
}
