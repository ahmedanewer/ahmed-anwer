import { WaitingParticipant } from '../types';

export type SocketEventType =
  | 'WAITING_ROOM_UPDATE'
  | 'EXAM_STARTED'
  | 'EXAM_ALREADY_LIVE'
  | 'EXAM_ENDED'
  | 'LEADERBOARD_UPDATE';

export interface SocketMessage {
  type: SocketEventType;
  examId?: string;
  status?: string;
  count?: number;
  participants?: WaitingParticipant[];
  serverStartTime?: number;
  serverEndTime?: number;
  durationMinutes?: number;
  leaderboard?: any[];
}

type MessageListener = (data: SocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Set<MessageListener> = new Set();
  private reconnectTimer: any = null;
  private currentRoom: { examId: string; user?: any; isAdmin?: boolean } | null = null;
  private pingInterval: any = null;

  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Clear reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }

        // Start ping interval
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 15000);

        // Rejoin room if we had one
        if (this.currentRoom) {
          this.joinRoom(this.currentRoom.examId, this.currentRoom.user, this.currentRoom.isAdmin);
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data: SocketMessage = JSON.parse(event.data);
          this.listeners.forEach((listener) => listener(data));
        } catch (err) {
          console.error('Error parsing incoming socket message:', err);
        }
      };

      this.ws.onclose = () => {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket encountered error:', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('Failed to instantiate WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2500);
  }

  public joinRoom(examId: string, user?: any, isAdmin = false): void {
    this.currentRoom = { examId, user, isAdmin };
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'JOIN_WAITING_ROOM',
          examId,
          user,
          isAdmin,
        })
      );
    } else {
      this.connect();
    }
  }

  public leaveRoom(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'LEAVE_WAITING_ROOM' }));
    }
    this.currentRoom = null;
  }

  public subscribe(listener: MessageListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const socketClient = new WebSocketClient();
