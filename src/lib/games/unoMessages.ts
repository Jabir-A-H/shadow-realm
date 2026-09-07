// Typed message protocol between host and guests in multiplayer Uno

export type CardColor = 'sumi' | 'vermillion' | 'indigo' | 'ochre' | 'none';
export type CardValue =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 'skip'
  | 'reverse'
  | 'draw2'
  | 'wild'
  | 'wildDraw4'
  | 'wildDraw6'
  | 'wildDraw10';

export interface Card {
  id: string;
  color: CardColor;
  value: CardValue;
}

export type UnoMode = 'cpu' | 'duel' | 'party' | 'custom';

export interface CustomRulesConfig {
  stackDraw2: boolean;
  stackDraw4: boolean;
  crossStacking: boolean;
  doubleDraw2Counter: boolean;
  specialWilds6And10: boolean;
  sevenZero: boolean;
  jumpIn: boolean;
  anyColorSlap?: boolean;
  multiCard: boolean;
  wild4Challenge: boolean;
  mercyKnockout: boolean;
  mercyThreshold: number; // default 25
  allowCustomChat: boolean; // default true
}

export interface LobbyPlayer {
  peerId: string;
  callsign: string;
  seat: number;
  isHost: boolean;
  ready: boolean;
  isAi?: boolean;
  playerToken?: string;
}

export interface GamePlayerSummary {
  peerId: string;
  callsign: string;
  seat: number;
  cardCount: number;
  isAi: boolean;
  isAfk: boolean;
  hasShoutedUno: boolean;
  isKnockedOut?: boolean;
  playerToken?: string;
}

export interface GameStateDelta {
  activeColor: CardColor;
  turnPlayerPeerId: string;
  deckSize: number;
  discardTop: Card;
  direction: 1 | -1;
  players: GamePlayerSummary[];
  activeDrawStack: number;
  customRules?: CustomRulesConfig;
  lastAction?: {
    type: 'play' | 'draw' | 'pass' | 'skip' | 'reverse' | 'uno_penalty' | 'jump_in' | 'seven_swap' | 'zero_rotate' | 'hand_swap' | 'table_rotate';
    peerId: string;
    card?: Card;
    chosenColor?: CardColor;
    drawCount?: number;
    penaltyDraw?: { peerId: string; count: number };
    extraMessage?: string;
    targetPeerId?: string;
    targetCallsign?: string;
    direction?: 1 | -1;
    steps?: number;
  };
}

export interface ChatMessage {
  id: string;
  peerId: string;
  callsign: string;
  text: string;
  timestamp: number;
}

export interface EmoteEvent {
  id: string;
  peerId: string;
  emote: string;
  chipText?: string;
}

export type GuestMessage =
  | { type: 'JOIN_LOBBY'; callsign: string; playerToken?: string }
  | { type: 'REQUEST_SEAT_SWAP'; targetSeat: number }
  | { type: 'READY'; ready: boolean }
  | { type: 'PLAY_CARD'; cardId: string; chosenColor?: CardColor }
  | { type: 'PLAY_MULTI_CARDS'; cardIds: string[]; chosenColor?: CardColor }
  | { type: 'DRAW_CARD' }
  | { type: 'PASS_TURN' }
  | { type: 'SHOUT_UNO' }
  | { type: 'CATCH_UNO'; targetPeerId: string }
  | { type: 'DISCONNECT_VOTE'; action: 'pause' | 'replace_ai' | 'replace_ai_turn' | 'replace_ai_permanent' }
  | { type: 'RESUME_GAME' }
  | { type: 'SEND_CHAT'; text: string }
  | { type: 'SEND_EMOTE'; emote: string; chipText?: string }
  | { type: 'SEVEN_SWAP_TARGET'; targetPeerId: string }
  | { type: 'JUMP_IN'; cardId: string }
  | { type: 'CHALLENGE_WILD_4' };

export type HostMessage =
  | { type: 'LOBBY_STATE'; players: LobbyPlayer[]; mode: UnoMode; customRules?: CustomRulesConfig }
  | {
      type: 'GAME_START';
      topCard: Card;
      deckSize: number;
      turnOrder: string[];
      direction: 1 | -1;
      players: GamePlayerSummary[];
      activeDrawStack: number;
      customRules?: CustomRulesConfig;
    }
  | { type: 'YOUR_HAND'; cards: Card[] }
  | { type: 'GAME_STATE_DELTA'; delta: GameStateDelta }
  | { type: 'PLAYER_LEFT'; peerId: string; isAfk: boolean }
  | { type: 'DISCONNECT_RESOLVED'; action?: 'pause' | 'replace_ai' | 'replace_ai_turn' | 'replace_ai_permanent' | 'player_resumed'; peerId: string }
  | {
      type: 'GAME_REJOIN_SYNC';
      gameState: GameStateDelta;
      turnOrder: string[];
      myHand: Card[];
      myPeerId: string;
    }
  | { type: 'GAME_PAUSED' }
  | { type: 'GAME_RESUMED' }
  | { type: 'GAME_OVER'; winnerPeerId: string; winnerCallsign: string }
  | { type: 'UNO_WINDOW_OPEN'; peerId: string }
  | { type: 'UNO_WINDOW_CLOSED'; peerId: string; caught: boolean }
  | { type: 'UNO_SHOUT_CONFIRMED'; peerId: string }
  | { type: 'CATCH_PENALTY_APPLIED'; penalizedPeerId: string; caughtByPeerId: string }
  | { type: 'CHAT_BROADCAST'; message: ChatMessage }
  | { type: 'EMOTE_BROADCAST'; event: EmoteEvent }
  | {
      type: 'SEVEN_SWAP_OCCURRED';
      fromPeerId: string;
      toPeerId: string;
      fromCallsign: string;
      toCallsign: string;
    }
  | { type: 'ZERO_ROTATE_OCCURRED'; direction: 1 | -1; steps?: number }
  | {
      type: 'HAND_SWAP_OCCURRED';
      fromPeerId: string;
      toPeerId: string;
      fromCallsign: string;
      toCallsign: string;
    }
  | { type: 'TABLE_ROTATE_OCCURRED'; direction: 1 | -1; steps?: number }
  | { type: 'PLAYER_KNOCKED_OUT'; peerId: string; callsign: string; reason: 'mercy' }
  | {
      type: 'CHALLENGE_RESULT';
      challengerPeerId: string;
      challengedPeerId: string;
      challengedHadMatch: boolean;
      penaltyDrawn: number;
    }
  | { type: 'ERROR'; code: string; message: string };

export type PeerEnvelope = {
  version: 1;
  from: string;
  to?: string;
  msg: GuestMessage | HostMessage;
};
