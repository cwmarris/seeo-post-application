export interface FounderProfile {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio: string;
  keyTopics: string[];
  history: string;
  linkedin: string;
}

export interface LinkedInPost {
  id: string;
  authorId: string;
  content: string;
  image?: string;
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'published';
  ratings?: number[];
  likes?: number;
  comments?: number;
  shares?: number;
  steepFocus: string[];
  tone: string;
  feedback?: string;
  publishResult?: {
    mode: 'mock' | 'dry_run' | 'live';
    message: string;
    previewUrl?: string;
    postUrn?: string;
  };
}

export const FOUNDER_PROFILES: FounderProfile[] = [
  {
    id: 'craig',
    name: 'Craig Marris',
    role: 'Co-Founder, seeo.ai',
    avatar: '/craig_marris.png',
    bio: 'Co-founder of seeo.ai. Former President/Owner and co-founder of Coretex (later acquired by EROAD). Focused on safety governance, operational leadership, and closing the gap between “work as imagined” and “work as done” using practical, measurable systems.',
    keyTopics: ['Safety governance', 'Operational leadership', 'Work as imagined vs. work as done', 'Telematics & fleet operations', 'AI for safety & productivity'],
    history:
      'Built and scaled a telematics business (Coretex) from New Zealand into overseas markets, ultimately joining EROAD after acquisition. Now building seeo.ai to use AI-driven video analysis to improve workplace safety and productivity outcomes.',
    linkedin: 'https://www.linkedin.com/in/craig-marris-2257831/'
  },
  {
    id: 'dean',
    name: 'Dean Marris',
    role: 'Co-Founder, seeo.ai',
    avatar: '/dean_marris.png',
    bio: 'Co-founder of seeo.ai. Former co-founder of Coretex and Chief Data Science Officer at EROAD. Brings a data-science-led approach to safety and operations: turning messy real-world signals into decisions teams can act on.',
    keyTopics: ['Data science leadership', 'Predictive analytics', 'Operational telemetry & IoT', 'AI for safety & workflow', 'Risk reduction'],
    history:
      'Co-founded Coretex and worked across telemetry-driven products and go-to-market expansion. At EROAD, led data science initiatives before co-founding seeo.ai to apply AI to existing camera infrastructure for safer, more productive operations.',
    linkedin: 'https://www.linkedin.com/in/deanmarris/'
  },
  {
    id: 'bede',
    name: 'Bede Cammock-Elliott',
    role: 'Co-Founder, seeo.ai',
    avatar: '/bede_cammock.png',
    bio: 'Co-founder of seeo.ai and Managing Director of seedigital (integrated remote video monitoring). Focused on using real-world video to surface “work as done”, redesign risky workflows, and sustain improvement through ongoing assurance.',
    keyTopics: ['Remote video monitoring', 'Work design & risk reduction', 'Safety culture & assurance', 'CCTV infrastructure & operations', 'Continuous improvement'],
    history:
      'Built seedigital into an integrated remote video monitoring business, combining video with access control and intrusion detection. Now co-founding seeo.ai to turn existing camera networks into practical safety and workflow insights for high-risk environments.',
    linkedin: 'https://www.linkedin.com/in/bede-cammock-elliott-3364649/'
  }
];

export const INITIAL_POSTS: LinkedInPost[] = [];

export const INITIAL_ANALYTICS = {
  totalImpressions: 0,
  averageEngagement: '0%',
  rlScore: 0,
  scheduledCount: 0,
  publishedCount: 0,
  frameworkDistribution: {
    Social: 30,
    Technological: 45,
    Economic: 15,
    Environmental: 5,
    Political: 5
  }
};
