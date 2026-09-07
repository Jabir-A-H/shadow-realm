import { GridSize } from './fleetEngine';

export interface FleetLobbyPlayer {
  id: string;
  callsign: string;
  isHost: boolean;
  ready: boolean;
}

export type FleetGuestMessage =
  | { type: 'FLEET_JOIN'; callsign: string }
  | { type: 'FLEET_READY' }
  | { type: 'FLEET_FIRE'; r: number; c: number }
  | { type: 'FLEET_SHOT_RESULT'; r: number; c: number; result: 'hit' | 'miss' | 'sunk'; shipId?: string }
  | { type: 'FLEET_EMOTE'; emote: string }
  | { type: 'FLEET_TAUNT'; text: string }
  | { type: 'FLEET_REMATCH_REQUEST' }
  | { type: 'FLEET_REMATCH_ACCEPT' };

export type FleetHostMessage =
  | { type: 'FLEET_LOBBY_STATE'; players: FleetLobbyPlayer[]; gridSize: GridSize }
  | { type: 'FLEET_START'; gridSize: GridSize }
  | { type: 'FLEET_GRID_SIZE_CHANGE'; gridSize: GridSize }
  | { type: 'FLEET_READY' }
  | { type: 'FLEET_BATTLE_START'; firstPlayer: 1 | 2 }
  | { type: 'FLEET_FIRE'; r: number; c: number }
  | { type: 'FLEET_SHOT_RESULT'; r: number; c: number; result: 'hit' | 'miss' | 'sunk'; shipId?: string }
  | { type: 'FLEET_GAME_OVER'; winner: 1 | 2 }
  | { type: 'FLEET_EMOTE'; emote: string; fromCallsign: string }
  | { type: 'FLEET_TAUNT'; text: string; fromCallsign: string }
  | { type: 'FLEET_REMATCH_REQUEST' }
  | { type: 'FLEET_REMATCH_ACCEPT' };
