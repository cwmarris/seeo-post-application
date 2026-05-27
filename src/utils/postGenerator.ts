import { FOUNDER_PROFILES } from './mockData';
import { filterBannedPhrases, type RLState } from './rlEngine';

/**
 * Custom generation library containing rich content blocks matching the co-founders' actual backgrounds,
 * the STEEP factors, and selected copywriting tones.
 */
const POST_SEGMENTS: Record<string, Record<string, string[]>> = {
  craig: {
    hooks: [
      "Let's be completely honest about safety: there is a huge difference between 'Work as Imagined' and 'Work as Done.'",
      "During my time growing Coretex and working with EROAD, we unlocked massive safety improvements in transport. But the manufacturing floor remained a black box. Until now.",
      "Safety governance shouldn't be about hindsight, investigations, and incident reports. It has to be about proactive leadership."
    ],
    social: [
      "Safety culture is created in the moments when nobody is looking. It's built on trust, coaching, and understanding why people make choices on the floor.",
      "True leadership is about bridging the gap between written standard operating procedures (SOPs) and the reality our workers face in the warehouse every day."
    ],
    technological: [
      "By using AI computer vision running on your existing CCTV infrastructure, we can see workplace safety violations in real time without massive capital investments.",
      "The tech at seeo.ai acts like a 24/7 auditor, converting passive cameras into proactive tools that protect lives and streamline operations."
    ],
    economic: [
      "Bridging the safety gap has direct financial impact. Lower injury rates, less machinery damage, and minimized warehouse down-time directly drive commercial strength.",
      "We proved in telematics that safety is profitable. The same holds true for the industrial floor: high safety standards are a significant competitive advantage."
    ],
    environmental: [
      "Optimizing warehouse safety and pedestrian corridors directly streamlines forklift operations, leading to less fuel consumption and a smaller environmental footprint.",
      "A safer, more orderly environment is a more sustainable environment. Resource efficiency starts with zero-incident governance."
    ],
    political: [
      "With increasing regulatory scrutiny around director liability and health & safety compliance, boards need empirical proof of safety management, not just policy binders.",
      "National safety regulations are raising the bar. Leaders must show active diligence, and having real-time analytics is the ultimate proof of governance."
    ],
    closings: [
      "Are you still managing safety through hindsight, or are you ready to make the invisible visible?",
      "Let's empower our teams with real-time coaching. The future of operations is visible, proactive safety.",
      "We are building seeo.ai to ensure every worker gets home safely at the end of the shift. Let's make it a reality."
    ]
  },
  dean: {
    hooks: [
      "For twenty years, telemetry meant reading engine data and GPS coordinates. Today, the most critical telemetry is visual.",
      "AI video analytics is changing everything we know about warehouse risk. Your security cameras are no longer just passive recorders.",
      "What if you could predict a pedestrian-forklift accident before it actually happened?"
    ],
    social: [
      "Operational harmony is achieved when workers, forklifts, and safety boundaries interact seamlessly. AI helps us understand that physical relationship.",
      "By providing instant, non-punitive visibility, we give logistics teams the insights they need to run operations in complete safety."
    ],
    technological: [
      "We run advanced edge-AI models directly on existing CCTV security streams. We are tracking proximity violations, PPE compliance, and speed parameters in real time.",
      "Our sensor fusion approach translates visual feeds into dynamic operational telemetry—just like we did with vehicle tracking at Coretex, but now applied to the floor."
    ],
    economic: [
      "Visual telemetry does more than prevent accidents; it optimizes operations. Less double-handling, smoother traffic, and higher warehouse efficiency.",
      "By avoiding single incidents, operations save tens of thousands in structural repairs, insurance overheads, and liability costs."
    ],
    environmental: [
      "Smart routing and pedestrian corridor enforcement reduce forklift idle times, directly curbing emissions in indoor logistics environments.",
      "A green factory is an optimized factory. Video analytics ensure that assets are operating at maximum fuel and battery efficiency."
    ],
    political: [
      "Global compliance standards for industrial automation are tightening. Having audit-ready visual analytics simplifies compliance reporting completely.",
      "Governing boards are demanding automated risk data. Visual telemetry replaces manual checklists with robust, continuous audit trails."
    ],
    closings: [
      "The security camera is the most underutilized sensor in modern industry. Let's unlock its power.",
      "Ready to turn your passive security system into a real-time risk mitigation engine? Let's talk seeo.ai.",
      "Let's drive operational excellence through visual telemetry. The future is visible."
    ]
  },
  bede: {
    hooks: [
      "When I started seedigital in 2003, security cameras were there to catch thieves. Fast forward to 2026, and they are active operational partners.",
      "Two decades in remote video monitoring taught me one major thing: you can't manage what you don't measure.",
      "CCTV has evolved from a security expense into an operational asset."
    ],
    social: [
      "A camera isn't a tool of surveillance; it is a tool of empowerment. It provides the objective reality needed to coach staff and build solid safety habits.",
      "True safety compliance is cultural. Giving managers real video clips of near-misses allows for constructive, evidence-based conversations."
    ],
    technological: [
      "seeo.ai represents the natural evolution of my twenty years at seedigital. We're layering advanced AI algorithms over existing commercial CCTV infrastructure.",
      "Layering computer vision on legacy networks allows us to audit every second of operational behavior without needing any new hardware."
    ],
    economic: [
      "Continuous video auditing is highly profitable. It minimizes compliance liabilities, prevents heavy machinery claims, and keeps insurance underwriters happy.",
      "Over my twenty years in the industry, the businesses that invest in proactive video monitoring are consistently the most profitable."
    ],
    environmental: [
      "Monitoring recycling streams, material flow, and heavy machinery routing helps manufacturers limit scrap and manage resources effectively.",
      "Sustainable manufacturing is about zero waste. Proactive video analytics helps us spot and fix bottlenecks that lead to resource spillages."
    ],
    political: [
      "Health and safety laws require directors to take all practicable steps. Continuous visual analytics is the gold standard for executive diligence.",
      "Meeting government work-safe standards is a continuous process. Our visual audit records provide immediate compliance validation."
    ],
    closings: [
      "CCTV was about security. seeo.ai is about safety and operational intelligence. Let's make the shift.",
      "Let's move your organization away from post-incident reports and toward proactive risk mitigation.",
      "Twenty years of video monitoring experience tells me this is the next frontier. Let's build it together."
    ]
  }
};

export interface GeneratePostOptions {
  variationSeed?: number;
}

function pickIndex(length: number, seed: number, salt: number): number {
  if (length <= 0) return 0;
  return Math.abs((seed + salt * 9973) % length);
}

/**
 * Generates an authentic seeo LinkedIn post based on user settings, STEEP framework, and RL configuration.
 */
export const generateLinkedInPost = (
  authorId: string,
  _tone: string,
  steepFocus: string[],
  groundedData: string,
  rlState: RLState,
  options?: GeneratePostOptions
): { content: string; replacedPhrases: string[]; wasFiltered: boolean } => {
  const authorData = POST_SEGMENTS[authorId] || POST_SEGMENTS.craig;
  const profile = FOUNDER_PROFILES.find(p => p.id === authorId) || FOUNDER_PROFILES[0];
  const seed = options?.variationSeed ?? Date.now();

  let hookIndex: number;
  if (rlState.hookStyle === 'empirical') hookIndex = Math.min(2, authorData.hooks.length - 1);
  else if (rlState.hookStyle === 'historical') hookIndex = Math.min(1, authorData.hooks.length - 1);
  else hookIndex = pickIndex(authorData.hooks.length, seed, 1);
  const hook = authorData.hooks[hookIndex] || authorData.hooks[0];

  const activeForces = [...(steepFocus.length > 0 ? steepFocus : ['Technological'])];
  for (let i = activeForces.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, seed, 10 + i);
    [activeForces[i], activeForces[j]] = [activeForces[j], activeForces[i]];
  }
  const bodyParagraphs: string[] = [];

  activeForces.forEach((force, idx) => {
    const key = force.toLowerCase();
    const paragraphList = authorData[key] || authorData.technological;
    const randPara = paragraphList[pickIndex(paragraphList.length, seed, 20 + idx)];
    bodyParagraphs.push(randPara);
  });

  // 3. Grounded Data Integration
  const groundedBlock = groundedData.trim()
    ? (() => {
        const groundedLines = groundedData.trim().split('\n');
        const firstLine = groundedLines[0];
        return `Here is a clear example from recent operations:
👉 ${firstLine}
${groundedLines.slice(1).map(line => `• ${line}`).join('\n')}`;
      })()
    : `In transport and manufacturing, we consistently see forklift near-misses go unreported. seeo.ai exposes these risks automatically, enabling supervisors to take proactive action.`;

  // 4. Tone Adjustments & Emoji Injection
  let emojiList = '🚨 ';
  if (rlState.emojiDensity === 'none') {
    emojiList = '';
  } else if (rlState.emojiDensity === 'medium') {
    emojiList = '📈 🛡️ ';
  }

  const closingList = authorData.closings;
  const closing = closingList[pickIndex(closingList.length, seed, 40)];

  // Assemble full text
  let fullPost = `${emojiList}${hook}

${bodyParagraphs.join('\n\n')}

${groundedBlock}

${closing}

#${profile.name.replace(/\s+/g, '')} #seeo #AI #WorkplaceSafety #STEEP`;

  // 5. Apply Reinforcement Learning Filtration (Banned Phrases)
  const { cleanText, replacedCount, replacements } = filterBannedPhrases(fullPost);

  return {
    content: cleanText,
    replacedPhrases: replacements,
    wasFiltered: replacedCount > 0
  };
};
