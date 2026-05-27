export type AuthorId = 'craig' | 'dean' | 'bede' | (string & {});

export type EmojiDensity = 'none' | 'medium' | (string & {});

export interface AuthorStyleSettings {
  /**
   * Style guide text injected into LLM prompts and used as a human-readable reference.
   * Keep it specific and copyable.
   */
  styleGuide: string;
  /**
   * Hashtags appended to the end of local template posts (order matters).
   */
  preferredHashtags: string[];
  /**
   * Optional emoji prefix tuned per author; RL can still override to none.
   */
  emojiPrefixByDensity?: Partial<Record<EmojiDensity, string>>;
}

const CRAIG_STYLE_GUIDE = `Author voice: Craig Marris (seeo.ai)

Tone:
- Reflective, grounded, and quietly confident.
- Gratitude-forward (name people/groups when appropriate), never boastful.
- Narrative-driven (clear arc), with an upbeat finish. No hype, no clichés.

Default structure (use when topic is a milestone / announcement / transition):
- Origin story (where I started / what shaped me)
- Growth (what I learned, built, or saw up close)
- Transition (why this change, why now)
- Announcement (what I'm doing next)
- Mission (what we're building + why it matters)
- Tagline (exact sentence): Same drive, new frontier.
- Thanks (specific gratitude; mentors/teams/customers/family as fits)
- Upbeat close (short, optimistic). Include the phrase: onwards and upwards

Ops + safety grounding (always):
- Anchor in real operations (warehouse/manufacturing/fleet). Be specific.
- Safety governance, diligence, coaching, learning loops; protect people without blame.
- Emphasize visibility and prevention (avoid surveillance framing).
- Coretex → EROAD learnings are allowed when relevant; connect to why seeo exists.

Vocabulary + phrases to use sparingly but accurately:
- "Same drive, new frontier."
- "onwards and upwards"

Length & punctuation:
- Prefer 900–1600 characters.
- Short paragraphs (1–2 sentences each). Use paragraph breaks generously.
- Use simple punctuation; avoid em dashes and excessive exclamation marks.

Formatting:
- No emojis.
- Avoid long bullet lists; if bullets appear, keep to 2–4 and concrete.
- 3–5 hashtags at the end. Prefer: #WorkplaceSafety #SafetyGovernance #VideoAnalytics #Operations #seeo`;

const DEFAULT_STYLE_GUIDE = `Write like a real founder/operator.

- Short paragraphs (1–2 sentences)
- Concrete details over abstractions
- End with 1–3 relevant hashtags`;

export const AUTHOR_STYLE_SETTINGS: Record<string, AuthorStyleSettings> = {
  craig: {
    styleGuide: CRAIG_STYLE_GUIDE,
    preferredHashtags: ['#WorkplaceSafety', '#SafetyGovernance', '#VideoAnalytics', '#Operations', '#seeo'],
    emojiPrefixByDensity: {
      none: '',
      medium: '',
    },
  },
  dean: {
    styleGuide: `Author voice: Dean Marris (seeo.ai)

Tone: technical, curious, systems thinker. Uses clear examples and "what if" questions.
Formatting: short paragraphs, occasional compact bullets, ends with a few hashtags.`,
    preferredHashtags: ['#AI', '#IoT', '#VideoAnalytics', '#IndustrialSafety', '#seeo'],
    emojiPrefixByDensity: {
      none: '',
      medium: '📈 ',
    },
  },
  bede: {
    styleGuide: `Author voice: Bede Cammock-Elliott (seeo.ai)

Tone: founder story, long time horizon, pragmatic. Anchors in video monitoring history.
Formatting: short paragraphs, occasional contrast (then vs now), ends with a few hashtags.`,
    preferredHashtags: ['#CCTV', '#Safety', '#OperationalIntelligence', '#RiskManagement', '#seeo'],
    emojiPrefixByDensity: {
      none: '',
      medium: '🛡️ ',
    },
  },
};

export function getAuthorStyleSettings(authorId: AuthorId): AuthorStyleSettings {
  return AUTHOR_STYLE_SETTINGS[authorId] ?? {
    styleGuide: DEFAULT_STYLE_GUIDE,
    preferredHashtags: ['#WorkplaceSafety', '#seeo'],
    emojiPrefixByDensity: { none: '', medium: '' },
  };
}

export function getAuthorStyleGuide(authorId: AuthorId): string {
  return getAuthorStyleSettings(authorId).styleGuide;
}

