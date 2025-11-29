import { Article, UserStats, Category } from '../types'

export const categories: Category[] = [
  'Malware',
  'Phishing',
  'AI Agents',
  'Data Breach',
  'Vulnerability',
  'Social Engineering',
  'Cloud Security',
  'DevSecOps',
  'Zero Trust',
  'Ransomware',
]

export const mockArticles: Article[] = [
  {
    id: '1',
    title:
      'Critical Zero-Day Vulnerability Discovered in Popular JavaScript Framework',
    source: 'The Hacker News',
    sourceUrl: 'https://thehackernews.com',
    publishedAt: '2024-01-15T14:30:00Z',
    category: ['Vulnerability', 'DevSecOps'],
    aiSummary:
      'A critical zero-day vulnerability (CVE-2024-1234) has been discovered in React Router v6.x that allows remote code execution. Security researchers recommend immediate patching. Over 2M downloads affected.',
    relevanceScore: 95,
    credibilityScore: 92,
    biasLabel: 'Center',
    uncertaintyLevel: 15,
    consumed: false,
    scrollDepth: 0,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop',
  },
  {
    id: '2',
    title: 'AI-Powered Phishing Attacks Increase 300% in Q4 2023',
    source: 'Krebs on Security',
    sourceUrl: 'https://krebsonsecurity.com',
    publishedAt: '2024-01-15T12:15:00Z',
    category: ['Phishing', 'AI Agents'],
    aiSummary:
      'Cybercriminals are leveraging large language models to craft highly convincing phishing emails. Detection rates have dropped significantly as AI-generated content bypasses traditional filters.',
    relevanceScore: 88,
    credibilityScore: 95,
    biasLabel: 'Center',
    uncertaintyLevel: 10,
    consumed: true,
    scrollDepth: 85,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=200&fit=crop',
  },
  {
    id: '3',
    title: 'New Ransomware Strain Targets Cloud Infrastructure',
    source: 'Bleeping Computer',
    sourceUrl: 'https://bleepingcomputer.com',
    publishedAt: '2024-01-15T10:45:00Z',
    category: ['Ransomware', 'Cloud Security'],
    aiSummary:
      'Security researchers have identified a new ransomware variant specifically designed to encrypt cloud storage buckets. The malware exploits misconfigured IAM policies to gain access.',
    relevanceScore: 82,
    credibilityScore: 88,
    biasLabel: 'Center',
    uncertaintyLevel: 20,
    consumed: false,
    scrollDepth: 0,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=200&fit=crop',
  },
  {
    id: '4',
    title: 'Major Tech Company Suffers Data Breach Affecting 50M Users',
    source: 'Dark Reading',
    sourceUrl: 'https://darkreading.com',
    publishedAt: '2024-01-15T09:20:00Z',
    category: ['Data Breach', 'Social Engineering'],
    aiSummary:
      'A sophisticated social engineering attack led to unauthorized access to customer databases. Exposed data includes email addresses, hashed passwords, and partial payment information.',
    relevanceScore: 91,
    credibilityScore: 85,
    biasLabel: 'Center-Left',
    uncertaintyLevel: 25,
    consumed: false,
    scrollDepth: 0,
    hasAudio: false,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop',
  },
  {
    id: '5',
    title: 'Zero Trust Architecture: Implementation Best Practices for 2024',
    source: 'CSO Online',
    sourceUrl: 'https://csoonline.com',
    publishedAt: '2024-01-15T08:00:00Z',
    category: ['Zero Trust', 'DevSecOps'],
    aiSummary:
      'Comprehensive guide to implementing zero trust security models in enterprise environments. Covers identity verification, micro-segmentation, and continuous monitoring strategies.',
    relevanceScore: 76,
    credibilityScore: 90,
    biasLabel: 'Center',
    uncertaintyLevel: 12,
    consumed: true,
    scrollDepth: 100,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop',
  },
  {
    id: '6',
    title: 'Malware Campaign Exploits Supply Chain Vulnerabilities',
    source: 'Security Week',
    sourceUrl: 'https://securityweek.com',
    publishedAt: '2024-01-14T16:30:00Z',
    category: ['Malware', 'Vulnerability'],
    aiSummary:
      'Threat actors have compromised multiple npm packages to distribute malware. The campaign affects over 100 downstream dependencies, highlighting supply chain security risks.',
    relevanceScore: 93,
    credibilityScore: 87,
    biasLabel: 'Center',
    uncertaintyLevel: 18,
    consumed: false,
    scrollDepth: 0,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=200&fit=crop',
  },
]

export const mockUserStats: UserStats = {
  dailyStreak: 12,
  totalArticlesRead: 247,
  badges: [
    {
      id: '1',
      name: 'Early Adopter',
      icon: '🚀',
      description: 'Joined in the first month',
      unlockedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Malware Expert',
      icon: '🦠',
      description: 'Read 100+ malware articles',
      unlockedAt: '2024-01-10T00:00:00Z',
    },
    {
      id: '3',
      name: 'Week Warrior',
      icon: '🔥',
      description: '7-day reading streak',
      unlockedAt: '2024-01-08T00:00:00Z',
    },
  ],
  rank: 42,
}
