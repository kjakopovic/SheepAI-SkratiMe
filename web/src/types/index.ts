export type Category =
  | 'cyber-security'
  | 'data-breaches'
  | 'malware-alerts'
  | 'vulnerability-reports'
  | 'privacy-updates'
  | 'cloud-security'
  | 'devsecops-news'
  | 'software-patches'
  | 'threat-intel'
  | 'network-security'

export interface Article {
  id: string
  title: string
  source: string
  sourceUrl: string
  publishedAt: string
  category: string[]
  aiSummary: string
  relevanceScore: number
  credibilityScore: number
  biasLabel: 'Left' | 'Center-Left' | 'Center' | 'Center-Right' | 'Right'
  uncertaintyLevel: number
  consumed: boolean
  scrollDepth: number
  hasAudio: boolean
  content: string
  imageUrl?: string
}
export interface UserStats {
  dailyStreak: number
  totalArticlesRead: number
  badges: Badge[]
  rank: number
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  unlockedAt?: string
}