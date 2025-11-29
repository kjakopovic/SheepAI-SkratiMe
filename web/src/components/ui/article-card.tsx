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

const sendBriefingEmail = async () => {
  const response = await fetch('https://sheep-ai-skrati-me-bmxo.vercel.app/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: 'marin.ivosevic91@gmail.com',
      breakingArticle: {
        title: 'MS Teams Guest Access Can Remove Defender Protection When Users Join External Tenants',
        summary: 'Cybersecurity researchers have shed light on a cross-tenant blind spot that allows attackers to bypass Microsoft Defender for Office 365 protections via the guest access feature in Teams.',
        image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_Md0lsjItddYFH1gCm6LZYxVDobM4ZWOweikeQFAT0yZNSYS8WKfg61LxSRjc49watAPtqESgvWx0UwppGQuw9FU8OMQDf9EOi1fWnVXF_H8L7QNOplD1-vdDAO-oU4cRg9CX2jky45M7SkmAF6b7GGi7UwMZQN4_7wnlG2D1mYl28_sUC7hLta8u37Oa/s790-rw-e365/msteams.jpg',
        url: 'https://thehackernews.com/2025/11/ms-teams-guest-access-can-remove.html',
        source: 'Ravie Lakshmanan'
      },
      relatedArticles: [
        {
          title: 'Legacy Python Bootstrap Scripts Create Domain-Takeover Risk in Multiple PyPI Packages',
          summary: 'Cybersecurity researchers have discovered vulnerable code in legacy Python packages that could potentially pave the way for a supply chain compromise on the Python Package Index (PyPI) via a domain takeover attack.',
          image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhMdVHqK8sA27WWR3ySGxson4kuqmBaXHQlFm3PSmRaHV6IGdnk_zK0tUvgrFyKepL2COnnm_yiIBdTy-ho7pFKSPQP7cCxkOugoV0s_2k3dUBYC0FI5BkY2tmR3Tsbxktsq7TnQRqzDhiOHe9SjVrRq2XHt5BYU01ctj8yUA8BTv6cDT8zREtEYAdrViUn/s790-rw-e365/setuptools.jpg',
          url: 'https://thehackernews.com/2025/11/legacy-python-bootstrap-scripts-create.html',
          source: 'Ravie Lakshmanan'
        },
        {
          title: 'North Korean Hackers Deploy 197 npm Packages to Spread Updated OtterCookie Malware',
          summary: 'The North Korean threat actors behind the Contagious Interview campaign have continued to flood the npm registry with 197 more malicious packages since last month.',
          image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgbHywoT-t7dx-yFp5L6Kj6AHPWvHYFoziGtqauAQGWvY55xCGgiw80AKaK962SgdMmomBf9EMT9cPAGPxx5GTi4lFq_ckm1Cjk3hGtRo1AnWVEjZkd89HlSOWuLuBC-whL565LElFcq2D55c9NrmQHx30eGNNugpcLqPAKDxRC5Zkwb-1lX1OC4Xu-QH13/s790-rw-e365/npm-malware.jpg',
          url: 'https://thehackernews.com/2025/11/north-korean-hackers-deploy-197-npm.html',
          source: 'The Hacker News'
        },
        {
          title: 'MS Teams Guest Access Can Remove Defender Protection When Users Join External Tenants',
          summary: 'Cybersecurity researchers have shed light on a cross-tenant blind spot that allows attackers to bypass Microsoft Defender for Office 365 protections via the guest access feature in Teams.',
          image: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEg_Md0lsjItddYFH1gCm6LZYxVDobM4ZWOweikeQFAT0yZNSYS8WKfg61LxSRjc49watAPtqESgvWx0UwppGQuw9FU8OMQDf9EOi1fWnVXF_H8L7QNOplD1-vdDAO-oU4cRg9CX2jky45M7SkmAF6b7GGi7UwMZQN4_7wnlG2D1mYl28_sUC7hLta8u37Oa/s790-rw-e365/msteams.jpg',
          url: 'https://thehackernews.com/2025/11/ms-teams-guest-access-can-remove.html',
          source: 'The Hacker News'
        }
      ]
    })
  }

  );

  const result = await response.json();
  console.log(result);
};

const formatCategoryName = (name: string) => {
  return name
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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
            <button className=' border-3 bg-amber-300 cursor-pointer' onClick={sendBriefingEmail}>Send email</button>
          </div>
        </div>
      </div>
    </article>
  )
}
