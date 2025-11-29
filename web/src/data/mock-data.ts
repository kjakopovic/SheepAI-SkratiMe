import { Article, UserStats, Category } from '../types'

export const mockArticles: Article[] = [
  {
    id: '1',
    title: 'Legacy Python Bootstrap Scripts Create Domain-Takeover Risk in Multiple PyPI Packages',
    source: 'The Hacker News',
    sourceUrl: 'https://thehackernews.com/2025/11/legacy-python-bootstrap-scripts-create.html',
    publishedAt: '2025-11-28T14:30:00Z',
    category: ['Malware', 'Vulnerability', 'Supply Chain'],
    aiSummary:
      'Cybersecurity researchers have discovered vulnerable code in legacy Python packages that could potentially pave the way for a supply chain compromise on the Python Package Index (PyPI) via a domain takeover attack. Affected packages include tornado, pypiserver, and slapos.core.',
    relevanceScore: 97,
    credibilityScore: 94,
    biasLabel: 'Center',
    uncertaintyLevel: 10,
    consumed: false,
    scrollDepth: 0,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1618060932014-4deda4932554?w=400&h=200&fit=crop', // Python/Code abstract image
  },
  {
    id: '2',
    title: 'North Korean Hackers Deploy 197 npm Packages to Spread Updated OtterCookie Malware',
    source: 'The Hacker News',
    sourceUrl: 'https://thehackernews.com/2025/11/north-korean-hackers-deploy-197-npm.html',
    publishedAt: '2025-11-28T12:15:00Z',
    category: ['Supply Chain Attack', 'Malware', 'North Korea'],
    aiSummary:
      'Threat actors have flooded the npm registry with 197 more malicious packages designed to deliver a variant of OtterCookie malware. The campaign exploits supply chain vulnerabilities to target developer environments.',
    relevanceScore: 92,
    credibilityScore: 95,
    biasLabel: 'Center',
    uncertaintyLevel: 15,
    consumed: false,
    scrollDepth: 0,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=200&fit=crop', // Hacker/Matrix image
  },
  {
    id: '3',
    title: 'Why Organizations Are Turning to RPAM',
    source: 'The Hacker News',
    sourceUrl: 'https://thehackernews.com/2025/11/why-organizations-are-turning-to-rpam.html',
    publishedAt: '2025-11-28T10:00:00Z',
    category: ['Enterprise Security', 'Threat Detection', 'IAM'],
    aiSummary:
      'As IT environments become increasingly distributed, organizations are adopting Remote Privileged Access Management (RPAM) to secure critical systems. This approach extends protection beyond traditional perimeters to wherever privileged users connect.',
    relevanceScore: 85,
    credibilityScore: 90,
    biasLabel: 'Center',
    uncertaintyLevel: 5,
    consumed: true,
    scrollDepth: 100,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=200&fit=crop', // Server/Cloud image
  },
  {
    id: '4',
    title: 'MS Teams Guest Access Can Remove Defender Protection When Users Join External Tenants',
    source: 'The Hacker News',
    sourceUrl: 'https://thehackernews.com/2025/11/ms-teams-guest-access-can-remove.html',
    publishedAt: '2025-11-28T09:20:00Z',
    category: ['Email Security', 'Enterprise Security', 'Microsoft'],
    aiSummary:
      'A cross-tenant blind spot in Microsoft Teams guest access allows attackers to bypass Microsoft Defender for Office 365 protections. Security policies are determined by the hosting environment, potentially leaving guests unprotected.',
    relevanceScore: 89,
    credibilityScore: 92,
    biasLabel: 'Center',
    uncertaintyLevel: 20,
    consumed: false,
    scrollDepth: 0,
    hasAudio: false,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=200&fit=crop', // Digital security lock
  },
  {
    id: '5',
    title: 'Bloody Wolf Expands Java-based NetSupport RAT Attacks in Kyrgyzstan and Uzbekistan',
    source: 'The Hacker News',
    sourceUrl: 'https://thehackernews.com/2025/11/bloody-wolf-expands-java-based.html',
    publishedAt: '2025-11-27T16:30:00Z',
    category: ['Malware', 'Social Engineering', 'APT'],
    aiSummary:
      'The Bloody Wolf threat actor has expanded its operations in Central Asia, targeting Kyrgyzstan and Uzbekistan. The group uses sophisticated social engineering and malicious Java Archives (JARs) to deploy the NetSupport RAT.',
    relevanceScore: 80,
    credibilityScore: 88,
    biasLabel: 'Center',
    uncertaintyLevel: 25,
    consumed: false,
    scrollDepth: 0,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=200&fit=crop', // Cybersecurity concept
  },
  {
    id: '6',
    title: 'Microsoft to Block Unauthorized Scripts in Entra ID Logins with 2026 CSP Update',
    source: 'The Hacker News',
    sourceUrl: 'https://thehackernews.com/2025/11/microsoft-to-block-unauthorized-scripts.html',
    publishedAt: '2025-11-27T14:00:00Z',
    category: ['Web Security', 'Zero Trust', 'Microsoft'],
    aiSummary:
      'Microsoft has announced plans to enhance Entra ID security by updating its Content Security Policy (CSP). The update will block unauthorized script injection attacks during the sign-in experience starting in 2026.',
    relevanceScore: 78,
    credibilityScore: 96,
    biasLabel: 'Center',
    uncertaintyLevel: 5,
    consumed: true,
    scrollDepth: 45,
    hasAudio: true,
    content: 'Full article content here...',
    imageUrl:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=200&fit=crop', // Authentication/Security
  },
]