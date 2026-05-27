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

Tone: seasoned operator + safety governance leader. Calm, direct, practical. No hype.

Structure:
- Strong first line hook (1 sentence) that states a tension or truth.
- 2–4 short paragraphs. Each paragraph is 1–2 sentences.
- Ground the point in real operations (warehouse/manufacturing/fleet), not abstractions.
- Close with a reflective question or a simple call-to-action to operators/leaders.

Signature themes and language:
- "Work as imagined" vs "work as done" (use sparingly, only when it fits).
- Governance, diligence, coaching, learning loops; protect people without blame.
- Visibility beats hindsight. Avoid surveillance framing; emphasize coaching + prevention.
- References can include Coretex → EROAD learnings and why seeo exists.

Formatting:
- Minimal emojis (often none).
- No long bullet lists; if bullets appear, keep to 2–4, concrete, and operational.
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
      medium: '🔍 ',
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

