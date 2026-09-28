import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import { db } from './db.js';
import { WaitingParticipant } from './types.js';

interface ClientConnection {
  ws: WebSocket;
  examId?: string;
  user?: WaitingParticipant;
  isAdmin?: boolean;
}

// In-memory active connections
const connections: Set<ClientConnection> = new Set();

// Track participants in waiting rooms: examId -> Map<userId, WaitingParticipant>
const waitingRooms: Map<string, Map<string, WaitingParticipant>> = new Map();

export function setupWebSocket(server: http.Server): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    const clientConn: ClientConnection = { ws };
    connections.add(clientConn);

    ws.on('message', (messageData: string) => {
      try {
        const data = JSON.parse(messageData.toString());

        switch (data.type) {
          case 'JOIN_WAITING_ROOM': {
            const { examId, user, isAdmin } = data;
            if (!examId) return;

            clientConn.examId = examId;
            clientConn.isAdmin = !!isAdmin;

            if (user && !isAdmin) {
              clientConn.user = {
                userId: user.id || user.userId,
                fullName: user.fullName,
                email: user.email,
                joinedAt: Date.now()
              };

              if (!waitingRooms.has(examId)) {
                waitingRooms.set(examId, new Map());
              }
              const room = waitingRooms.get(examId)!;
              room.set(clientConn.user.userId, clientConn.user);
            }

            // Check if exam is already live
            const exam = db.getExamById(examId);
            if (exam && exam.status === 'live' && exam.liveEndsAt && exam.liveEndsAt > Date.now()) {
              ws.send(JSON.stringify({
                type: 'EXAM_ALREADY_LIVE',
                examId,
                serverStartTime: exam.liveStartedAt,
                serverEndTime: exam.liveEndsAt,
                durationMinutes: exam.durationMinutes
              }));
            }

            broadcastWaitingRoom(examId);
            break;
          }

          case 'LEAVE_WAITING_ROOM': {
            handleLeave(clientConn);
            break;
          }

          case 'PING': {
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
          }
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    ws.on('close', () => {
      handleLeave(clientConn);
      connections.delete(clientConn);
    });

    ws.on('error', (err) => {
      console.error('WebSocket connection error:', err);
      handleLeave(clientConn);
      connections.delete(clientConn);
    });
  });

  return wss;
}

function handleLeave(client: ClientConnection) {
  if (client.examId && client.user) {
    const room = waitingRooms.get(client.examId);
    if (room) {
      room.delete(client.user.userId);
      if (room.size === 0) {
        waitingRooms.delete(client.examId);
      }
    }
    broadcastWaitingRoom(client.examId);
    client.examId = undefined;
    client.user = undefined;
  }
}

export function getWaitingParticipants(examId: string): WaitingParticipant[] {
  const room = waitingRooms.get(examId);
  return room ? Array.from(room.values()) : [];
}

export function broadcastWaitingRoom(examId: string) {
  const participants = getWaitingParticipants(examId);
  const exam = db.getExamById(examId);
  const message = JSON.stringify({
    type: 'WAITING_ROOM_UPDATE',
    examId,
    status: exam?.status || 'idle',
    count: participants.length,
    participants
  });

  for (const client of connections) {
    if (client.examId === examId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function broadcastExamStart(examId: string, liveStartedAt: number, liveEndsAt: number, durationMinutes: number) {
  const message = JSON.stringify({
    type: 'EXAM_STARTED',
    examId,
    serverStartTime: liveStartedAt,
    serverEndTime: liveEndsAt,
    durationMinutes
  });

  for (const client of connections) {
    if (client.examId === examId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function broadcastExamEnd(examId: string) {
  const message = JSON.stringify({
    type: 'EXAM_ENDED',
    examId
  });

  for (const client of connections) {
    if (client.examId === examId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function broadcastLeaderboardUpdate() {
  const leaderboard = db.getLeaderboard().slice(0, 10);
  const message = JSON.stringify({
    type: 'LEADERBOARD_UPDATE',
    leaderboard
  });

  for (const client of connections) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}
