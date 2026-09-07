import { useState, useEffect, useRef, useCallback } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabase';

export interface ArcadePeerEnvelope<T = unknown> {
  version: 1;
  from: string;
  to?: string;
  msg: T;
  actionId?: string;
}

export interface UseArcadePeerRoomOptions<TGuestMsg = unknown, THostMsg = unknown> {
  gamePrefix: string;
  roomId: string;
  mode: 'host' | 'guest';
  onMessage: (msg: TGuestMsg | THostMsg, fromPeerId: string) => void;
  onPeerJoin?: (peerId: string) => void;
  onPeerLeave?: (peerId: string) => void;
  enabled?: boolean;
}

export interface UseArcadePeerRoomReturn<TGuestMsg = unknown, THostMsg = unknown> {
  myPeerId: string;
  hostPeerId: string;
  connectedPeers: string[];
  connectionState: 'idle' | 'initializing' | 'connected' | 'error' | 'disconnected';
  errorMessage: string | null;
  sendToHost: (msg: TGuestMsg, actionId?: string) => void;
  sendToPeer: (peerId: string, msg: THostMsg, actionId?: string) => void;
  sendToAll: (msg: THostMsg, actionId?: string) => void;
  disconnect: () => void;
  requestSyncAck: (actionId: string, msg: THostMsg, onAllAck: () => void, timeoutMs?: number) => void;
  sendSyncAck: (actionId: string) => void;
}

/**
 * Universal multiplayer room hook powered by Supabase Realtime (Broadcast + Presence).
 * Provides low-latency ephemeral P2P rooms with 4-character room codes.
 */
export function useArcadePeerRoom<TGuestMsg = unknown, THostMsg = unknown>({
  gamePrefix,
  roomId,
  mode,
  onMessage,
  onPeerJoin,
  onPeerLeave,
  enabled = true,
}: UseArcadePeerRoomOptions<TGuestMsg, THostMsg>): UseArcadePeerRoomReturn<TGuestMsg, THostMsg> {
  const [myPeerId, setMyPeerId] = useState<string>('');
  const [connectedPeers, setConnectedPeers] = useState<string[]>([]);
  const [connectionState, setConnectionState] = useState<
    'idle' | 'initializing' | 'connected' | 'error' | 'disconnected'
  >('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const myIdRef = useRef<string>('');
  const connectedPeersRef = useRef<string[]>([]);
  const onMessageRef = useRef(onMessage);
  const onPeerJoinRef = useRef(onPeerJoin);
  const onPeerLeaveRef = useRef(onPeerLeave);

  const pendingAcksRef = useRef<
    Map<string, { expectedPeers: Set<string>; onComplete: () => void; timer: NodeJS.Timeout }>
  >(new Map());

  onMessageRef.current = onMessage;
  onPeerJoinRef.current = onPeerJoin;
  onPeerLeaveRef.current = onPeerLeave;
  connectedPeersRef.current = connectedPeers;

  const normalizedRoomId = roomId.trim().toUpperCase();
  const hostPeerId = `${gamePrefix}-${normalizedRoomId}`;

  const cleanup = useCallback(() => {
    pendingAcksRef.current.forEach(({ timer }) => clearTimeout(timer));
    pendingAcksRef.current.clear();

    if (channelRef.current) {
      const ch = channelRef.current;
      channelRef.current = null;
      try {
        ch.untrack();
        supabase.removeChannel(ch);
      } catch (e) {
        console.error(`[${gamePrefix}] Error during channel removal:`, e);
      }
    }

    setConnectedPeers([]);
    setConnectionState('disconnected');
  }, [gamePrefix]);

  useEffect(() => {
    if (!enabled || !normalizedRoomId || typeof window === 'undefined') {
      return;
    }

    if (!isSupabaseConfigured()) {
      setErrorMessage('Supabase Realtime is not configured. Add VITE_SUPABASE_URL to .env.');
      setConnectionState('error');
      return;
    }

    let isCancelled = false;
    setConnectionState('initializing');
    setErrorMessage(null);

    let targetPlayerId = '';
    if (mode === 'host') {
      targetPlayerId = hostPeerId;
    } else {
      const sessionKey = `shadow_realm:${gamePrefix}:guest_id:${normalizedRoomId}`;
      let storedId = sessionStorage.getItem(sessionKey);
      if (!storedId) {
        storedId = `${gamePrefix}-g-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
        sessionStorage.setItem(sessionKey, storedId);
      }
      targetPlayerId = storedId;
    }

    myIdRef.current = targetPlayerId;
    setMyPeerId(targetPlayerId);

    const topic = `arcade:${gamePrefix}:${normalizedRoomId}`;
    const channel = supabase.channel(topic, {
      config: {
        broadcast: { ack: false, self: false },
        presence: { key: targetPlayerId },
      },
    });

    channelRef.current = channel;

    // 1. Broadcast receiver
    channel.on('broadcast', { event: 'msg' }, ({ payload }) => {
      if (isCancelled) return;
      const envelope = payload as ArcadePeerEnvelope<TGuestMsg | THostMsg>;
      if (!envelope || !envelope.from) return;

      if (envelope.to && envelope.to !== targetPlayerId) {
        return;
      }

      if (envelope.actionId && (envelope.msg as Record<string, unknown>)?.type === '__SYNC_ACK__') {
        if (mode === 'host') {
          const pending = pendingAcksRef.current.get(envelope.actionId);
          if (pending) {
            pending.expectedPeers.delete(envelope.from);
            if (pending.expectedPeers.size === 0) {
              clearTimeout(pending.timer);
              pendingAcksRef.current.delete(envelope.actionId);
              pending.onComplete();
            }
          }
        }
        return;
      }

      if (envelope.msg) {
        onMessageRef.current(envelope.msg, envelope.from);
      }
    });

    // 2. Presence tracking
    channel.on('presence', { event: 'sync' }, () => {
      if (isCancelled) return;
      const state = channel.presenceState();
      const onlinePeers = Object.keys(state).filter((key) => key !== targetPlayerId);
      connectedPeersRef.current = onlinePeers;
      setConnectedPeers(onlinePeers);
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }: { key: string; newPresences: Array<{ playerId?: string }> }) => {
      if (isCancelled) return;
      const joinedKey = key || newPresences?.[0]?.playerId;
      if (joinedKey && joinedKey !== targetPlayerId) {
        onPeerJoinRef.current?.(joinedKey);
      }
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }: { key: string; leftPresences: Array<{ playerId?: string }> }) => {
      if (isCancelled) return;
      const leftKey = key || leftPresences?.[0]?.playerId;
      if (leftKey && leftKey !== targetPlayerId) {
        onPeerLeaveRef.current?.(leftKey);
      }
    });

    // 3. Subscription
    channel.subscribe(async (status) => {
      if (isCancelled) return;

      if (status === 'SUBSCRIBED') {
        setConnectionState('connected');
        setErrorMessage(null);

        try {
          await channel.track({
            playerId: targetPlayerId,
            isHost: mode === 'host',
            joinedAt: Date.now(),
          });
        } catch (err) {
          console.error(`[${gamePrefix}] Failed to track presence:`, err);
        }
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
        console.error(`[${gamePrefix}] Channel subscription failed with status:`, status);
        setErrorMessage('Failed to connect to game room. Please check your network.');
        setConnectionState('error');
      } else if (status === 'CLOSED') {
        setConnectionState('disconnected');
      }
    });

    return () => {
      isCancelled = true;
      cleanup();
    };
  }, [enabled, mode, normalizedRoomId, hostPeerId, gamePrefix, cleanup]);

  const sendToHost = useCallback(
    (msg: TGuestMsg, actionId?: string) => {
      const ch = channelRef.current;
      if (!ch) return;
      const envelope: ArcadePeerEnvelope<TGuestMsg> = {
        version: 1,
        from: myIdRef.current,
        to: hostPeerId,
        msg,
        actionId,
      };
      ch.send({
        type: 'broadcast',
        event: 'msg',
        payload: envelope,
      }).catch((err) => {
        console.warn(`[${gamePrefix}] Error broadcasting to host:`, err);
      });
    },
    [gamePrefix, hostPeerId]
  );

  const sendToPeer = useCallback(
    (peerId: string, msg: THostMsg, actionId?: string) => {
      const ch = channelRef.current;
      if (!ch) return;
      const envelope: ArcadePeerEnvelope<THostMsg> = {
        version: 1,
        from: myIdRef.current,
        to: peerId,
        msg,
        actionId,
      };
      ch.send({
        type: 'broadcast',
        event: 'msg',
        payload: envelope,
      }).catch((err) => {
        console.warn(`[${gamePrefix}] Error broadcasting to peer ${peerId}:`, err);
      });
    },
    [gamePrefix]
  );

  const sendToAll = useCallback(
    (msg: THostMsg, actionId?: string) => {
      const ch = channelRef.current;
      if (!ch) return;
      const envelope: ArcadePeerEnvelope<THostMsg> = {
        version: 1,
        from: myIdRef.current,
        msg,
        actionId,
      };
      ch.send({
        type: 'broadcast',
        event: 'msg',
        payload: envelope,
      }).catch((err) => {
        console.warn(`[${gamePrefix}] Error broadcasting to room:`, err);
      });
    },
    [gamePrefix]
  );

  const requestSyncAck = useCallback(
    (actionId: string, msg: THostMsg, onAllAck: () => void, timeoutMs = 5000) => {
      const activePeers = connectedPeersRef.current;

      if (activePeers.length === 0) {
        onAllAck();
        return;
      }

      const timer = setTimeout(() => {
        pendingAcksRef.current.delete(actionId);
        onAllAck();
      }, timeoutMs);

      pendingAcksRef.current.set(actionId, {
        expectedPeers: new Set(activePeers),
        onComplete: onAllAck,
        timer,
      });

      sendToAll(msg, actionId);
    },
    [sendToAll]
  );

  const sendSyncAck = useCallback(
    (actionId: string) => {
      sendToHost({ type: '__SYNC_ACK__' } as unknown as TGuestMsg, actionId);
    },
    [sendToHost]
  );

  return {
    myPeerId,
    hostPeerId,
    connectedPeers,
    connectionState,
    errorMessage,
    sendToHost,
    sendToPeer,
    sendToAll,
    disconnect: cleanup,
    requestSyncAck,
    sendSyncAck,
  };
}
