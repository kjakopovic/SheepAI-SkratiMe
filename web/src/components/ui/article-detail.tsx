import React, { useEffect } from 'react'
import { XIcon, ExternalLinkIcon } from 'lucide-react'
import { Article } from '../../types'
import { CredibilityPanel } from './credibility-panel'
import { CATEGORIES } from '../../data/categories'

interface ArticleDetailProps {
  article: Article
  onClose: () => void
}

const formatCategoryName = (name: string) => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Get category names from IDs
  const articleCategories = article.category.map(catId => {
    const category = CATEGORIES.find(c => c.id === catId);
    return category ? category.name : null;
  }).filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      <div
        className="absolute inset-0 bg-black/20 blur-in-2xl"
        role="button"
        tabIndex={0}
        aria-label="Close overlay"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
      />

      <div className="relative w-full max-w-4xl h-full bg-white overflow-y-auto scrollbar-thin animate-slide-in">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-300 px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <XIcon className="w-5 h-5 text-morplo-gray-600" />
              </button>
              <div>
                <div className="text-sm font-medium text-morplo-gray-900">
                  {article.source}
                </div>
                <div className="text-sm text-morplo-gray-600">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <a
              href={article.linkToArticle}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-morplo-blue-100 hover:bg-morplo-gray-130 rounded-lg transition-colors flex items-center gap-2"
            >
              <span className="hidden sm:inline">View original</span>
              <ExternalLinkIcon className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {articleCategories.map((catName, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium uppercase tracking-wide"
                    >
                      {formatCategoryName(catName as string)}
                    </span>
                  ))}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-(--text-primary) mb-6 leading-tight">
                  {article.title}
                </h1>

                {article.imageUrl && (
                  <div className="rounded-xl overflow-hidden mb-6">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="w-full h-48 md:h-80 object-cover"
                    />
                  </div>
                )}

                <div className="bg-morplo-gray-150 border-l-4 border-morplo-blue-100 p-6 rounded-r-lg mb-8">
                  <div className="text-xs font-semibold text-morplo-blue-100 mb-2 uppercase tracking-wide">
                    Summary
                  </div>
                  <p className="text-morplo-gray-900 leading-relaxed">
                    {article.aiSummary}
                  </p>
                </div>

                <div className="prose prose-lg max-w-none">
                  {article.fullContent ? (
                    article.fullContent.split('\n').map((paragraph, index) => (
                      paragraph.trim() && (
                        <p key={index} className="text-morplo-gray-700 leading-relaxed mb-4">
                          {paragraph}
                        </p>
                      )
                    ))
                  ) : (
                    <p className="text-morplo-gray-700 leading-relaxed">
                      {article.content}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="col-span-1">
              <div className="sticky top-24">
                <CredibilityPanel article={article} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
