import {
  ASSISTANT_KNOWLEDGE,
  ASSISTANT_SCOPE_MESSAGE,
  STARTER_QUESTIONS,
} from '../constants/assistantKnowledge';

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare',
  'ought', 'used', 'to', 'of', 'for', 'on', 'with', 'at', 'by',
  'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'out', 'off', 'over', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why',
  'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
  'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
  'just', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am',
  'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she',
  'they', 'them', 'tell', 'know', 'please', 'question', 'ask', 'want',
]);

/** Map common spoken phrases to searchable terms before matching. */
const PHRASE_ALIASES = [
  [/log\s*in/g, 'login'],
  [/sign\s*in/g, 'login'],
  [/sign\s*on/g, 'login'],
  [/sign\s*up/g, 'signup register'],
  [/get\s*started/g, 'register signup'],
  [/log\s*out/g, 'logout'],
  [/sign\s*out/g, 'logout'],
  [/how\s+can\s+i\s+use\s+(it|this|the\s+system|community\s+connect\s+hub)/g, 'how use system guide'],
  [/how\s+do\s+i\s+use\s+(it|this|the\s+system|community\s+connect\s+hub)/g, 'how use system guide'],
  [/how\s+to\s+use/g, 'how use system guide'],
  [/character\s+reference/g, 'character reference letter'],
];

/** Direct intent routes for short conversational questions. */
const INTENT_ROUTES = [
  { pattern: /\b(login|log\s*in|sign\s*in|sign\s*on)\b/, entryId: 'login' },
  { pattern: /\b(log\s*out|sign\s*out)\b/, entryId: 'login' },
  { pattern: /\b(register|sign\s*up|get\s*started|create\s+account)\b/, entryId: 'register-resident' },
  { pattern: /\b(official|pre[\s-]?registered)\b.*\b(register|sign\s*up)\b/, entryId: 'register-official' },
  { pattern: /\bhow\b.*\b(use|using|start|started|navigate|work)\b/, entryId: 'getting-started' },
  { pattern: /\b(guide|help me|show me|steps|tutorial)\b/, entryId: 'getting-started' },
  { pattern: /\bwhat\s+is\b.*\b(community\s+connect|connect\s+hub|this\s+system|the\s+system)\b/, entryId: 'purpose' },
  { pattern: /\b(submit|make|send|create)\b.*\b(request|requests)\b/, entryId: 'requests' },
  { pattern: /\b(character\s+reference|reference\s+letter)\b/, entryId: 'character-reference' },
  { pattern: /\b(community\s+need|community\s+needs)\b/, entryId: 'community-need' },
  { pattern: /\b(statutory\s+declaration)\b/, entryId: 'letters' },
  { pattern: /\b(dashboard|after\s+login)\b/, entryId: 'dashboard' },
  { pattern: /\b(nid|national\s+id)\b/, entryId: 'nid' },
  { pattern: /\bpassword\b/, entryId: 'password' },
  { pattern: /\b(complaint|complaints)\b/, entryId: 'complaints' },
  { pattern: /\b(project|projects)\b/, entryId: 'projects' },
  { pattern: /\b(wdc|ward\s+development)\b/, entryId: 'wdc' },
  { pattern: /\b(councillor|councilor)\b/, entryId: 'councillor' },
  { pattern: /\bannouncements?\b/, entryId: 'announcements' },
  { pattern: /\bprofile\b/, entryId: 'profile' },
];

const SYSTEM_ANCHORS = new Set([
  'community', 'connect', 'hub', 'register', 'registration', 'signup', 'login',
  'logout', 'request', 'requests', 'project', 'projects', 'ward', 'wards',
  'councillor', 'councilor', 'wdc', 'letter', 'letters', 'reference', 'complaint',
  'announcement', 'announcements', 'dashboard', 'nid', 'resident', 'residents',
  'mayor', 'meeting', 'meetings', 'resolution', 'resolutions', 'acquittal',
  'funding', 'dsip', 'psip', 'madang', 'nabasa', 'profile', 'notification',
  'document', 'documents', 'official', 'password', 'terms', 'rating', 'proposal',
  'llg', 'character', 'statutory', 'declaration', 'support', 'account', 'service',
  'governance', 'platform', 'system', 'features', 'purpose', 'track', 'submit',
  'download', 'use', 'using', 'guide', 'help', 'start', 'started', 'navigate',
  'steps', 'log', 'sign', 'access', 'email',
]);

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function expandQuestionPhrases(text) {
  let expanded = normalizeText(text);
  PHRASE_ALIASES.forEach(([pattern, replacement]) => {
    expanded = expanded.replace(pattern, replacement);
  });
  return expanded;
}

function tokenize(text) {
  return expandQuestionPhrases(text)
    .split(' ')
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}

function tokenMatchesKeyword(token, keyword) {
  if (token === keyword) return true;
  if (keyword.includes(' ')) {
    return keyword.split(' ').every((part) => part === token || tokenMatchesKeyword(token, part));
  }
  if (token.length < 3 || keyword.length < 3) return false;
  return keyword.includes(token) || token.includes(keyword);
}

function hasSystemAnchor(tokens, normalizedQuestion) {
  if (tokens.some((token) => SYSTEM_ANCHORS.has(token))) return true;
  return [...SYSTEM_ANCHORS].some((anchor) => normalizedQuestion.includes(anchor));
}

function isGuideIntent(normalizedQuestion) {
  return /\b(use|using|guide|help|start|started|navigate|steps|tutorial|how)\b/.test(normalizedQuestion)
    && /\b(it|this|system|platform|hub|connect|community|login|register|dashboard|work)\b/.test(normalizedQuestion);
}

function findIntentEntry(normalizedQuestion) {
  for (const route of INTENT_ROUTES) {
    if (route.pattern.test(normalizedQuestion)) {
      const entry = ASSISTANT_KNOWLEDGE.find((item) => item.id === route.entryId);
      if (entry) return entry;
    }
  }
  return null;
}

function scoreEntry(questionTokens, normalizedQuestion, entry) {
  let score = 0;
  const entryQuestion = normalizeText(entry.question);
  const entryAnswer = normalizeText(entry.answer);
  const keywords = entry.keywords.map(normalizeText);

  if (normalizedQuestion.includes(entryQuestion) || entryQuestion.includes(normalizedQuestion)) {
    score += 12;
  }

  keywords.forEach((keyword) => {
    if (normalizedQuestion.includes(keyword)) {
      score += keyword.includes(' ') ? 6 : 4;
    }
  });

  questionTokens.forEach((token) => {
    if (keywords.some((keyword) => tokenMatchesKeyword(token, keyword))) {
      score += 2;
    }
    if (entryQuestion.split(' ').some((word) => tokenMatchesKeyword(token, word))) score += 1.5;
    if (entryAnswer.split(' ').some((word) => tokenMatchesKeyword(token, word))) score += 0.5;
  });

  return score;
}

/**
 * Answer a user question using the curated Community Connect Hub knowledge base only.
 * @returns {{ answer: string, matchedId: string | null, inScope: boolean }}
 */
export function answerAssistantQuestion(question, { role } = {}) {
  const trimmed = String(question ?? '').trim();
  if (!trimmed) {
    return {
      answer: 'Please type a question about Community Connect Hub — for example: "How do I log in?" or "How do I use the system?"',
      matchedId: null,
      inScope: true,
    };
  }

  const normalizedQuestion = expandQuestionPhrases(trimmed);
  const tokens = tokenize(trimmed);

  if (tokens.length === 0 && !isGuideIntent(normalizedQuestion)) {
    return {
      answer: ASSISTANT_SCOPE_MESSAGE,
      matchedId: null,
      inScope: false,
    };
  }

  const intentEntry = findIntentEntry(normalizedQuestion);
  if (intentEntry && (!intentEntry.roles?.length || !role || intentEntry.roles.includes(role))) {
    return {
      answer: intentEntry.answer,
      matchedId: intentEntry.id,
      inScope: true,
    };
  }

  let bestEntry = null;
  let bestScore = 0;

  ASSISTANT_KNOWLEDGE.forEach((entry) => {
    if (entry.roles?.length && role && !entry.roles.includes(role)) {
      return;
    }
    const score = scoreEntry(tokens, normalizedQuestion, entry);
    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  });

  const inScope = hasSystemAnchor(tokens, normalizedQuestion) || isGuideIntent(normalizedQuestion);

  if (!bestEntry || bestScore < 3 || !inScope) {
    return {
      answer: ASSISTANT_SCOPE_MESSAGE,
      matchedId: null,
      inScope: false,
    };
  }

  return {
    answer: bestEntry.answer,
    matchedId: bestEntry.id,
    inScope: true,
  };
}

export function getStarterQuestions() {
  return STARTER_QUESTIONS;
}
