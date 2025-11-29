export type CategoryName =
  | 'breaking-news'
  | 'privacy-updates'
  | 'devsecops-news'
  | 'malware-alerts'
  | 'uncategorised'
  | 'cloud-security'
  | 'networ'
  | 'vulnerability-reports'
  | 'software-patches'
  | 'cyber-security'
  | 'threat-intel'
  | 'network-security'

export type CategoryId = string

export interface Category {
  id: CategoryId
  name: CategoryName
}

export interface Article {
  id: string
  title: string
  source: string
  sourceUrl: string
  publishedAt: string
  category: CategoryId[]
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
}