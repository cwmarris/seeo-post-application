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

export const INITIAL_POSTS: LinkedInPost[] = [
  {
    id: 'post-1',
    authorId: 'craig',
    content: `Safety isn’t just a line in a corporate policy handbook. It's what happens on the warehouse floor when nobody is looking. 

In my years building Coretex, we proved that telematics could save lives by making fleet operations visible. But a massive blind spot remained: the physical warehouse and manufacturing floor. 

At seeo.ai, we talk about the gap between "Work as Imagined" (our beautiful, written SOPs) and "Work as Done" (the real-world shortcut a forklift driver takes). 

By using AI on existing CCTV cameras, we aren't "spying" on people—we are giving management the "cultural artefacts" (real-world video clips of safety deviations) needed to coach, educate, and prevent accidents before they occur. 

Safety culture isn't built on hindsight. It's built on real-time visibility. 

#WorkplaceSafety #SafetyGovernance #AI #Logistics #seeo`,
    image: '/warehouse_safety.png',
    status: 'published',
    likes: 142,
    comments: 24,
    shares: 11,
    steepFocus: ['Social', 'Technological'],
    tone: 'Thought Leader'
  },
  {
    id: 'post-2',
    authorId: 'dean',
    content: `For decades, telemetry meant reading engine data, GPS coords, and harsh braking events. But what if the most critical sensor in your industrial facility is the one you already own?

Your security CCTV camera.

By running AI models on existing camera streams, we are transforming standard video into dynamic safety sensors. We can now detect:
- Pedestrian-forklift proximity violations in real-time.
- Staff operating in hazardous zones without PPE.
- Exact durations of forklift speeds exceeding limits in high-density corridors.

This isn't futuristic science fiction; it is immediate operational telemetry. By connecting the dots between IoT and video analytics, seeo.ai helps managers transition from reactive hindsight to proactive foresight.

Let's make the invisible visible.

#AI #IoT #VideoAnalytics #IndustrialSafety #Telematics #seeo`,
    image: '/warehouse_safety.png',
    status: 'scheduled',
    scheduledTime: '2026-05-28T09:00:00',
    steepFocus: ['Technological', 'Economic'],
    tone: 'Tech Visionary'
  },
  {
    id: 'post-3',
    authorId: 'bede',
    content: `When I founded seedigital back in 2003, CCTV was purely about security and theft prevention. If something went wrong, you rewound the tape to see who did it. That was hindsight.

Fast forward over twenty years. 

Cameras are no longer passive recorders. With seeo.ai, they are active operational partners. 

We can now look at a warehouse, detect near-misses in real-time, and flag systematic deviations from standard procedures. We're taking the 24/7 audit out of the spreadsheets and putting it directly on the screen. 

This technological evolution is driving massive economic benefits: lower insurance premiums, fewer operational shutdowns, and most importantly, making sure everyone gets home safely at the end of the shift.

Continuous improvement isn't a goal; it's a practice.

#AI #SafetyFirst #CCTV #OperationalIntelligence #RiskManagement`,
    image: '/steep_framework.png',
    status: 'published',
    likes: 89,
    comments: 15,
    shares: 6,
    steepFocus: ['Technological', 'Economic', 'Environmental'],
    tone: 'Founder Story'
  }
];

export const INITIAL_ANALYTICS = {
  totalImpressions: 14850,
  averageEngagement: '4.8%',
  rlScore: 92,
  scheduledCount: 1,
  publishedCount: 2,
  frameworkDistribution: {
    Social: 30,
    Technological: 45,
    Economic: 15,
    Environmental: 5,
    Political: 5
  }
};
