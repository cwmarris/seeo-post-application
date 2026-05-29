export interface RLState {
  bannedWords: string[];
  steepWeights: Record<string, number>; // Social, Technological, etc. (0 to 100)
  emojiDensity: 'none' | 'low' | 'medium' | 'high';
  hookStyle: 'question' | 'provocative' | 'historical' | 'empirical';
  bannedPhrasesReplacedCount: number;
  postCountRated: number;
  averageRating: number;
}

const DEFAULT_RL_STATE: RLState = {
  bannedWords: ['delve', 'testament', "in today's fast-paced world", 'in today\'s digital age', 'revolutionary', 'game-changing', 'transformative paradigm'],
  steepWeights: {
    Social: 50,
    Technological: 50,
    Economic: 50,
    Environmental: 50,
    Political: 50
  },
  emojiDensity: 'low',
  hookStyle: 'provocative',
  bannedPhrasesReplacedCount: 0,
  postCountRated: 0,
  averageRating: 0
};

const BANNED_SYNONYMS: Record<string, string> = {
  'delve': 'explore',
  'testament': 'evidence',
  "in today's fast-paced world": 'in operations today',
  "in today's digital age": 'in modern industry',
  'revolutionary': 'groundbreaking',
  'game-changing': 'highly effective',
  'transformative paradigm': 'operational model'
};

export const getRLState = (): RLState => {
  const saved = localStorage.getItem('seeo_rl_state');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_RL_STATE;
    }
  }
  return DEFAULT_RL_STATE;
};

export const saveRLState = (state: RLState) => {
  localStorage.setItem('seeo_rl_state', JSON.stringify(state));
};

export const addBannedWord = (word: string): RLState => {
  const state = getRLState();
  const lowerWord = word.trim().toLowerCase();
  if (lowerWord && !state.bannedWords.includes(lowerWord)) {
    state.bannedWords.push(lowerWord);
    saveRLState(state);
  }
  return state;
};

export const removeBannedWord = (word: string): RLState => {
  const state = getRLState();
  state.bannedWords = state.bannedWords.filter(w => w !== word);
  saveRLState(state);
  return state;
};

/**
 * Automatically checks and replaces banned phrases with modern premium alternatives.
 * Tracks statistics on replacements.
 */
export const filterBannedPhrases = (text: string): { cleanText: string; replacedCount: number; replacements: string[] } => {
  const state = getRLState();
  let cleanText = text;
  let replacedCount = 0;
  const replacements: string[] = [];

  state.bannedWords.forEach(banned => {
    // Create case-insensitive regex for the banned word/phrase
    const regex = new RegExp(`\\b${banned}\\b`, 'gi');
    if (regex.test(cleanText)) {
      // Determine replacement synonym
      const synonym = BANNED_SYNONYMS[banned.toLowerCase()] || 'examine';
      
      // Match casing of original first letter
      cleanText = cleanText.replace(regex, (matchedStr) => {
        replacedCount++;
        replacements.push(`"${matchedStr}" ➔ "${synonym}"`);
        if (matchedStr[0] === matchedStr[0].toUpperCase()) {
          return synonym[0].toUpperCase() + synonym.slice(1);
        }
        return synonym;
      });
    }
  });

  if (replacedCount > 0) {
    state.bannedPhrasesReplacedCount += replacedCount;
    saveRLState(state);
  }

  return { cleanText, replacedCount, replacements };
};

/**
 * Processes user post ratings and adjusts reinforcement learning weights accordingly.
 */
export const ratePostAndAdapt = (rating: number, aspectFeedback: string[], steepFactors: string[]): RLState => {
  const state = getRLState();
  
  // Calculate running average rating
  const totalRated = state.postCountRated;
  const newAverage = ((state.averageRating * totalRated) + rating) / (totalRated + 1);
  state.postCountRated = totalRated + 1;
  state.averageRating = parseFloat(newAverage.toFixed(2));

  // Reinforcement step: Adapt STEEP framework weights based on rating and factors
  steepFactors.forEach(factor => {
    const currentWeight = state.steepWeights[factor] || 50;
    if (rating >= 4) {
      // Reward: Increase weight/focus of this STEEP component
      state.steepWeights[factor] = Math.min(100, currentWeight + 10);
    } else if (rating <= 2) {
      // Penalize: Decrease weight
      state.steepWeights[factor] = Math.max(0, currentWeight - 10);
    }
  });

  // Adapt structural/style preferences based on text feedback tags
  aspectFeedback.forEach(feedback => {
    switch (feedback) {
      case 'Too salesy':
        state.emojiDensity = 'none';
        break;
      case 'Love the hook':
        state.hookStyle = 'provocative';
        break;
      case 'Empirical/Data-driven':
        state.hookStyle = 'empirical';
        break;
      case 'Captures history well':
        state.hookStyle = 'historical';
        break;
      case 'Too AI-sounding':
        // Reduce emoji, increase empirical hook focus
        state.emojiDensity = 'none';
        state.hookStyle = 'empirical';
        break;
    }
  });

  saveRLState(state);
  return state;
};
