import React, { useEffect } from 'react'
import { XIcon, ExternalLinkIcon } from 'lucide-react'
import { Article } from '../../types'
import { CredibilityPanel } from './credibility-panel'
interface ArticleDetailProps {
  article: Article
  onClose: () => void
}
export const ArticleDetail: React.FC<ArticleDetailProps> = ({ article, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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
              href={article.sourceUrl}
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
                  <p className="text-morplo-gray-700 leading-relaxed">
                    {article.content}
                  </p>
                  <p className="text-morplo-gray-700 leading-relaxed mt-6">
                    This is a demonstration of the article detail view. In a
                    production environment, this would display the full article
                    content with proper formatting, images, and embedded media.
                  </p>
                  <p className="text-morplo-gray-700 leading-relaxed mt-6">
                    The system analyzes articles for credibility and bias to
                    help you make informed decisions about the content you
                    consume. These metrics are displayed in the sidebar for easy
                    reference.
                  </p>
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
