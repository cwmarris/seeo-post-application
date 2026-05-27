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
    bio: 'Former co-founder of Christchurch-based telematics pioneer Coretex (acquired by EROAD). Passionate about safety governance, leadership culture, and translating corporate policies into on-site behavioral change.',
    keyTopics: ['Safety Culture', 'Work as Imagined vs. Work as Done', 'Operational Governance', 'Transport & Logistics Safety'],
    history: 'Founded Coretex and grew it to a leading global telematics player before its landmark acquisition by EROAD, where I served in key executive leadership roles. Now building seeo.ai to bridge safety gaps using video intelligence.',
    linkedin: 'https://www.linkedin.com/in/craig-marris-2257831/'
  },
  {
    id: 'dean',
    name: 'Dean Marris',
    role: 'Co-Founder, seeo.ai',
    avatar: '/dean_marris.png',
    bio: 'Former co-founder of Coretex. Hardware/telemetry pioneer and telematics system architect. Expert in real-time sensor fusion, predictive risk management, and industrial operational intelligence.',
    keyTopics: ['AI Video Intelligence', 'Predictive Analytics', 'IoT & Telemetry Integration', 'Real-time Safety Rules'],
    history: 'Co-founded Coretex, architecting high-performance fleet safety and vehicle tracking telemetry. Bringing twenty years of telemetry data and operational control excellence to the video analytics domain with seeo.ai.',
    linkedin: 'https://www.linkedin.com/in/deanmarris/'
  },
  {
    id: 'bede',
    name: 'Bede Cammock-Elliott',
    role: 'Co-Founder, seeo.ai',
    avatar: '/bede_cammock.png',
    bio: 'Founder of seedigital, a remote video monitoring pioneer operating since 2003. Expert in CCTV infrastructure evolution, safety compliance, manufacturing, and commercial risk mitigation.',
    keyTopics: ['CCTV Video Evolution', 'Empirical Operations', 'Manufacturing Automation Safety', 'Continuous Risk Mitigation'],
    history: 'Built seedigital into a premium commercial video monitoring and security service over 20+ years. Partnering with Craig and Dean to inject advanced edge-AI intelligence into existing security camera networks.',
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
