import React from 'react'
import { ShieldCheckIcon, TrendingUpIcon } from 'lucide-react'
import { Article } from '../../types'
import { Chatbot } from './chatbot'
interface CredibilityPanelProps {
  article: Article
}
export function CredibilityPanel({ article }: CredibilityPanelProps) {
  const getCredibilityColor = (score: number) => {
    if (score >= 85) return 'var(--color-morplo-green-100)'
    if (score >= 70) return 'var(--color-morplo-yellow-400)'
    return 'var(--color-morplo-gray-600)'
  }
  const credibilityColor = getCredibilityColor(article.credibilityScore)
  return (
    <div className="bg-white rounded-xl p-6 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheckIcon className="w-5 h-5 text-morplo-blue-100" />
          <h3 className="text-sm font-semibold text-morplo-gray-900">
            Credibility Score
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-2xl font-semibold"
                style={{
                  color: credibilityColor,
                }}
              >
                {article.credibilityScore}
              </span>
              <span className="text-sm text-morplo-gray-600">
                out of 100
              </span>
            </div>
            <div className="h-2 bg-morplo-gray-130 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500 rounded-full"
                style={{
                  width: `${article.credibilityScore}%`,
                  backgroundColor: credibilityColor,
                }}
              />
            </div>
          </div>

          <p className="text-sm text-morplo-gray-700 leading-relaxed">
            This score reflects the article's reliability based on source
            reputation, citation quality, and content analysis.
          </p>
        </div>
      </div>

      <div className="border-t border-morplo-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUpIcon className="w-5 h-5 text-morplo-blue-100" />
          <h3 className="text-sm font-semibold text-morplo-gray-900">
            Bias Analysis
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-morplo-gray-700">
                Political Lean
              </span>
              <span className="text-sm font-medium text-morplo-gray-900">
                {article.biasLabel}
              </span>
            </div>

            <div className="relative h-2 bg-morplo-gray-130 rounded-full overflow-hidden">
              <div
                className="absolute top-0 w-1 h-full bg-morplo-blue-100 rounded-full transition-all duration-500"
                style={{
                  left:
                    article.biasLabel === 'Left'
                      ? '10%'
                      : article.biasLabel === 'Center-Left'
                        ? '30%'
                        : article.biasLabel === 'Center'
                          ? '50%'
                          : article.biasLabel === 'Center-Right'
                            ? '70%'
                            : '90%',
                }}
              />
            </div>

            <div className="flex justify-between text-xs text-morplo-gray-600 mt-2">
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
          </div>

          <p className="text-sm text-morplo-gray-700 leading-relaxed">
            Analysis based on language patterns and framing choices in the
            article.
          </p>
          <Chatbot />
        </div>

      </div>
    </div>
  )
}
