export type { Card, CardColor, CardValue, UnoMode, CustomRulesConfig } from './unoMessages';
import type { Card, CardColor, CardValue, CustomRulesConfig } from './unoMessages';

export const COLORS: CardColor[] = ['sumi', 'vermillion', 'indigo', 'ochre'];

export const COLOR_MAP: Record<CardColor, string> = {
  'sumi': 'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-950 border-neutral-700 dark:border-neutral-300',
  'vermillion': 'bg-[var(--color-ink-secondary)] text-white border-red-700',
  'indigo': 'bg-blue-800 text-white border-blue-900',
  'ochre': 'bg-amber-600 text-white border-amber-700',
  'none': 'bg-neutral-600 text-white border-neutral-500',
};

export const COLOR_NAMES: Record<CardColor, string> = {
  'sumi': 'Sumi (Black)',
  'vermillion': 'Vermillion (Red)',
  'indigo': 'Indigo (Blue)',
  'ochre': 'Ochre (Yellow)',
  'none': 'None',
};

export const DEFAULT_CUSTOM_RULES: CustomRulesConfig = {
  stackDraw2: false,
  stackDraw4: false,
  crossStacking: false,
  doubleDraw2Counter: false,
  specialWilds6And10: false,
  sevenZero: false,
  jumpIn: false,
  anyColorSlap: false,
  multiCard: false,
  wild4Challenge: false,
  mercyKnockout: false,
  mercyThreshold: 25,
  allowCustomChat: true,
};

export const STACK_WAR_RULES: CustomRulesConfig = {
  stackDraw2: true,
  stackDraw4: true,
  crossStacking: true,
  doubleDraw2Counter: true,
  specialWilds6And10: false,
  sevenZero: false,
  jumpIn: false,
  anyColorSlap: false,
  multiCard: true,
  wild4Challenge: true,
  mercyKnockout: false,
  mercyThreshold: 25,
  allowCustomChat: true,
};

export const SPEED_SLAP_RULES: CustomRulesConfig = {
  stackDraw2: true,
  stackDraw4: true,
  crossStacking: false,
  doubleDraw2Counter: false,
  specialWilds6And10: false,
  sevenZero: false,
  jumpIn: true,
  anyColorSlap: true,
  multiCard: false,
  wild4Challenge: true,
  mercyKnockout: false,
  mercyThreshold: 25,
  allowCustomChat: true,
};

export const MIND_SWAP_RULES: CustomRulesConfig = {
  stackDraw2: true,
  stackDraw4: false,
  crossStacking: false,
  doubleDraw2Counter: false,
  specialWilds6And10: false,
  sevenZero: true,
  jumpIn: true,
  anyColorSlap: false,
  multiCard: true,
  wild4Challenge: true,
  mercyKnockout: false,
  mercyThreshold: 25,
  allowCustomChat: true,
};

export const NO_MERCY_RULES: CustomRulesConfig = {
  stackDraw2: true,
  stackDraw4: true,
  crossStacking: true,
  doubleDraw2Counter: true,
  specialWilds6And10: true,
  sevenZero: true,
  jumpIn: false,
  anyColorSlap: false,
  multiCard: false,
  wild4Challenge: true,
  mercyKnockout: true,
  mercyThreshold: 25,
  allowCustomChat: true,
};

export const CHAOS_TABLE_RULES: CustomRulesConfig = {
  stackDraw2: true,
  stackDraw4: true,
  crossStacking: true,
  doubleDraw2Counter: true,
  specialWilds6And10: true,
  sevenZero: true,
  jumpIn: true,
  anyColorSlap: true,
  multiCard: true,
  wild4Challenge: true,
  mercyKnockout: true,
  mercyThreshold: 25,
  allowCustomChat: true,
};

/**
 * Generates the simplified deck used in vs-CPU and 1v1 duel modes.
 */
export function generateDeckSimple(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  for (const c of COLORS) {
    for (let v = 1; v <= 9; v++) {
      deck.push({ id: `c-${id++}`, color: c, value: v as CardValue });
      deck.push({ id: `c-${id++}`, color: c, value: v as CardValue });
    }
    deck.push({ id: `c-${id++}`, color: c, value: 'skip' });
    deck.push({ id: `c-${id++}`, color: c, value: 'skip' });
    deck.push({ id: `c-${id++}`, color: c, value: 'draw2' });
    deck.push({ id: `c-${id++}`, color: c, value: 'draw2' });
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: `c-${id++}`, color: 'none', value: 'wild' });
    deck.push({ id: `c-${id++}`, color: 'none', value: 'wildDraw4' });
  }

  return shuffle(deck);
}

/**
 * Generates the full 108-card standard UNO deck for Party mode.
 */
export function generateDeckFull(): Card[] {
  const deck: Card[] = [];
  let id = 0;

  for (const c of COLORS) {
    deck.push({ id: `cf-${id++}`, color: c, value: 0 });

    for (let v = 1; v <= 9; v++) {
      deck.push({ id: `cf-${id++}`, color: c, value: v as CardValue });
      deck.push({ id: `cf-${id++}`, color: c, value: v as CardValue });
    }

    deck.push({ id: `cf-${id++}`, color: c, value: 'skip' });
    deck.push({ id: `cf-${id++}`, color: c, value: 'skip' });
    deck.push({ id: `cf-${id++}`, color: c, value: 'reverse' });
    deck.push({ id: `cf-${id++}`, color: c, value: 'reverse' });
    deck.push({ id: `cf-${id++}`, color: c, value: 'draw2' });
    deck.push({ id: `cf-${id++}`, color: c, value: 'draw2' });
  }

  for (let i = 0; i < 4; i++) {
    deck.push({ id: `cf-${id++}`, color: 'none', value: 'wild' });
    deck.push({ id: `cf-${id++}`, color: 'none', value: 'wildDraw4' });
  }

  return shuffle(deck);
}

/**
 * Generates a custom deck based on enabled house rules (adds +6 and +10 special wilds).
 */
export function generateDeckCustom(config: CustomRulesConfig): Card[] {
  const deck = generateDeckFull();
  let id = 900;

  if (config.specialWilds6And10) {
    deck.push({ id: `sp-${id++}`, color: 'none', value: 'wildDraw6' });
    deck.push({ id: `sp-${id++}`, color: 'none', value: 'wildDraw6' });
    deck.push({ id: `sp-${id++}`, color: 'none', value: 'wildDraw10' });
    deck.push({ id: `sp-${id++}`, color: 'none', value: 'wildDraw10' });
  }

  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Determines whether a given card can be legally played.
 * Enforces active stacking rules and "No Wild Finish" rule.
 */
export function isLegalMove(
  card: Card,
  topCard: Card | null,
  currentActiveColor: CardColor,
  hand: Card[],
  activeStack = 0,
  config?: CustomRulesConfig
): boolean {
  if (!topCard) return true;

  // RULE: Active Stacking Check
  if (activeStack > 0 && config) {
    if (card.value === 'draw2') {
      if (config.stackDraw2 || config.crossStacking) return true;
    }
    if (card.value === 'wildDraw4') {
      if (config.stackDraw4 || config.crossStacking) return true;
    }
    if (card.value === 'wildDraw6' || card.value === 'wildDraw10') {
      if (config.specialWilds6And10) return true;
    }
    return false; // Cannot play non-stacking card when stack is active!
  }

  // RULE: Cannot end on a wild card
  if (card.color === 'none') {
    if (hand.length === 1) return false;
    return true;
  }

  if (card.color === currentActiveColor) return true;
  if (card.value === topCard.value) return true;
  return false;
}

/**
 * Checks if two Draw-2 cards can be played together to counter a +4 stack.
 */
export function canDoubleDraw2Counter(
  cards: Card[],
  activeStack: number,
  config?: CustomRulesConfig
): boolean {
  if (!config?.doubleDraw2Counter) return false;
  if (activeStack <= 0) return false;
  if (cards.length !== 2) return false;
  return cards.every((c) => c.value === 'draw2');
}

/**
 * Checks if multiple cards of the same number can be played at once.
 */
export function isMultiCardPlayLegal(
  cards: Card[],
  topCard: Card,
  activeColor: CardColor,
  hand: Card[],
  config?: CustomRulesConfig,
  activeStack: number = 0
): boolean {
  if (!config?.multiCard) return false;
  if (cards.length < 2) return false;

  const first = cards[0];
  const allSameValue = cards.every((c) => c.value === first.value);
  if (!allSameValue) return false;

  // Wildcards cannot be multi-played
  if (first.color === 'none') return false;

  // At least one of the cards must match the discard pile / active stack
  const hasLegalLead = cards.some((c) => isLegalMove(c, topCard, activeColor, hand, activeStack, config));
  return hasLegalLead;
}

/**
 * Jump-In / Slap UNO validation:
 * - anyColorSlap: Match same value or action symbol in ANY color (e.g. Orange Reverse on Red Reverse)
 * - jumpIn (Normal Slap): Exact twin match (identical color AND identical value)
 */
export function isJumpInLegal(
  card: Card,
  topCard: Card | null,
  config?: CustomRulesConfig
): boolean {
  if (!config?.jumpIn && !config?.anyColorSlap) return false;
  if (!topCard) return false;
  // Wildcards cannot jump in / slap
  if (card.color === 'none' || topCard.color === 'none') return false;

  // 1. Any-Color Slap rule: Match same value/action symbol in ANY color
  if (config?.anyColorSlap) {
    return card.value === topCard.value;
  }

  // 2. Normal Slap rule: Exact identical twin (same color and value)
  if (config?.jumpIn) {
    return card.color === topCard.color && card.value === topCard.value;
  }

  return false;
}

/**
 * Seven-0 Hand Swap: swaps hands between two players.
 */
export function applySevenSwap(
  handsMap: Map<string, Card[]>,
  peerA: string,
  peerB: string
): void {
  const handA = handsMap.get(peerA) || [];
  const handB = handsMap.get(peerB) || [];
  handsMap.set(peerA, handB);
  handsMap.set(peerB, handA);
}

/**
 * Seven-0 Hand Rotate: rotates all players' hands in the active turn direction.
 * steps: number of positions to rotate (e.g. 1, or 2+ if multiple rotation cards stacked)
 */
export function applyTableRotate(
  handsMap: Map<string, Card[]>,
  turnOrder: string[],
  direction: 1 | -1,
  steps = 1
): void {
  const n = turnOrder.length;
  if (n <= 1) return;

  const handsCopy = new Map(handsMap);
  for (let i = 0; i < n; i++) {
    const shift = ((direction * steps) % n + n) % n;
    const fromIdx = (i - shift + n) % n;
    const fromPeerId = turnOrder[fromIdx];
    const toPeerId = turnOrder[i];
    handsMap.set(toPeerId, handsCopy.get(fromPeerId) || []);
  }
}

export const applyZeroRotate = applyTableRotate;
export const applyHandSwap = applySevenSwap;

/**
 * Computes next turn index given current index, direction (1 or -1), step, and total players.
 */
export function getNextPlayerIndex(
  currentIndex: number,
  direction: 1 | -1,
  step: number,
  totalPlayers: number
): number {
  if (totalPlayers <= 0) return 0;
  const raw = currentIndex + direction * step;
  return ((raw % totalPlayers) + totalPlayers) % totalPlayers;
}

/**
 * CPU AI move selector: selects best legal card to play or null to draw.
 */
export function cpuPickCard(
  hand: Card[],
  topCard: Card,
  activeColor: CardColor,
  activeStack = 0,
  config?: CustomRulesConfig
): { card: Card; chosenColor: CardColor } | null {
  const legalCards = hand.filter((c) =>
    isLegalMove(c, topCard, activeColor, hand, activeStack, config)
  );
  if (legalCards.length === 0) return null;

  const specials = legalCards.filter((c) => typeof c.value === 'string');
  const toPlay = specials.length > 0 ? specials[0] : legalCards[0];

  let chosenColor = toPlay.color;
  if (toPlay.color === 'none') {
    const counts: Record<'sumi' | 'vermillion' | 'indigo' | 'ochre', number> = {
      sumi: 0,
      vermillion: 0,
      indigo: 0,
      ochre: 0,
    };
    hand.forEach((c) => {
      if (c.color !== 'none') counts[c.color]++;
    });
    const entries = Object.entries(counts) as ['sumi' | 'vermillion' | 'indigo' | 'ochre', number][];
    entries.sort((a, b) => b[1] - a[1]);
    chosenColor = entries[0][0];
  }

  return { card: toPlay, chosenColor };
}

const ROOM_CHARSET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function generateRoomId(length = 5): string {
  let res = '';
  for (let i = 0; i < length; i++) {
    res += ROOM_CHARSET.charAt(Math.floor(Math.random() * ROOM_CHARSET.length));
  }
  return res;
}
