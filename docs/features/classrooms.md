# Live Interactive Classrooms Module

Real-time collaborative classrooms with video, chat, whiteboard, and live code editing. Built on WebRTC (via simple-peer) and Socket.IO for peer-to-peer media and real-time data sync.

## Architecture

```text
┌──────────────────────────────────────────────────────────────────┐
│                        React Frontend                             │
│  ClassroomsDashboard (create/join)                                │
│  ClassroomRoom → WebRTC (simple-peer) + Socket.IO                │
│    ├── VideoTile (camera/screen share)                            │
│    ├── Whiteboard (HTML5 Canvas)                                  │
│    ├── SharedCodeEditor (Monaco Editor)                           │
│    └── Chat + Participants sidebar                                │
└──────────────────────────┬───────────────────────────────────────┘
                           │ REST + WebSocket
┌──────────────────────────▼───────────────────────────────────────┐
│                      Node.js Backend                              │
│  routes.js → controller.js → service.js                           │
│  socket.js → in-memory room state + Socket.IO event handlers     │
│  Models: ClassroomSession                                         │
│  State: roomStates Map (chat, code, whiteboard in memory)        │
└──────────────────────────────────────────────────────────────────┘
```

## Classroom Flow

1. **Tutor creates session** → `POST /api/classrooms/create` generates UUID room ID
2. **Students join** → Enter room ID or select from active sessions list
3. **WebRTC setup** → Each peer connects via `simple-peer` with `trickle: false`
4. **Media streams** → Camera/mic via `getUserMedia`, screen share via `getDisplayMedia`
5. **Collaboration** → Chat, whiteboard strokes, code changes synced via Socket.IO
6. **Tutor ends session** → Chat history + code snapshot persisted to MongoDB

## WebRTC Implementation

### Peer Connection Flow

```text
Student A joins                     Student B joins
     │                                   │
     ├── join-room ────────────────►     │
     │                                   ├── join-room ──────►
     │◄── room-participants ────────     │
     │    (with B's socket ID)           │
     │                                   │
     ├── webrtc-offer ──────────────►    │
     │    (to B's socket ID)             │
     │                                   │
     │◄── webrtc-answer ────────────     │
     │                                   │
     │◄──── ICE candidates ────────►     │
     │                                   │
     │◄══════ P2P Media Stream ═══════►  │
```

### Security

- Every WebRTC event validates the sender is in `activeSocketIdsRef` (prevents unauthorized stream injection)
- Cross-classroom message injection prevented by validating `socket.data.roomId === roomId`

### Media Controls

| Control      | Implementation                                       |
| ------------ | ---------------------------------------------------- |
| ---------    | ---------------                                      |
| Mute/Unmute  | Toggle `audioTrack.enabled`                          |
| Video On/Off | Toggle `videoTrack.enabled`                          |
| Screen Share | `getDisplayMedia()` → `replaceTrack()` on all peers  |
| Hand Raise   | Emits `toggle-hand-raise` → broadcasts state to room |

## Real-Time Collaboration

### Whiteboard

- HTML5 Canvas with mouse/touch drawing
- Coordinates normalized to 0-1 range (resolution-independent)
- Colors: Sky Blue, Neon Green, Neon Red, Yellow, Purple, White
- Tools: Pen, Eraser, line width slider (2-20), Clear All
- Canvas content saved/restored on window resize

**Socket events:** `draw-stroke`, `clear-canvas`

### Shared Code Editor

- Monaco Editor with collaborative editing
- Languages: JavaScript, Python, HTML, CSS, C++
- Remote change detection prevents echo loops (`isRemoteChangeRef`)
- Cursor position broadcasting
- Code execution: `execute-code-request` → server broadcasts `execution-result`

**Socket events:** `code-change`, `code-cursor`, `execute-code-request`, `execution-result`

### Chat

- Real-time messaging via Socket.IO
- Chat history stored in-memory during session (max 100 messages)
- Persisted to MongoDB only when tutor ends the session

## In-Memory Room State

```javascript
roomStates = Map {
  "room-uuid" => {
    chatHistory: [{ sender, message, timestamp }],
    code: "current code content",
    whiteboard: [strokeData]
  }
}
```

- Created on first join, cleared when tutor ends session
- Chat and code are **not** in MongoDB during the session (lean DB)
- Final state saved to `ClassroomSession` on session end

## Database Model

### ClassroomSession

| Field             | Type     | Notes                     |
| ----------------- | -------- | ------------------------- |
| -------           | ------   | -------                   |
| `roomId`          | String   | UUID, unique, indexed     |
| `title`           | String   | Required, max 100 chars   |
| `subject`         | String   | Optional                  |
| `host`            | ObjectId | Ref: User (tutor)         |
| `status`          | String   | active/ended              |
| `maxParticipants` | Number   | 2-100, default 30         |
| `chatHistory`     | Array    | Saved on session end      |
| `codeSnapshot`    | String   | Final code on session end |
| `endedAt`         | Date     | Set when ended            |

## Socket.IO Events

### Client → Server

| Event                  | Data                                             | Description       |
| ---------------------- | ------------------------------------------------ | ----------------- |
| -------                | ------                                           | -------------     |
| `join-room`            | `{ roomId, user: {id, name} }`                   | Join a classroom  |
| `chat-message`         | `{ roomId, message }`                            | Send chat message |
| `toggle-hand-raise`    | `{ roomId }`                                     | Toggle hand raise |
| `webrtc-offer`         | `{ signal, userToSignal, callerId, callerUser }` | WebRTC offer      |
| `webrtc-answer`        | `{ signal, callerId }`                           | WebRTC answer     |
| `draw-stroke`          | `{ roomId, strokeData }`                         | Whiteboard stroke |
| `clear-canvas`         | `{ roomId }`                                     | Clear whiteboard  |
| `code-change`          | `{ roomId, code }`                               | Code update       |
| `code-cursor`          | `{ roomId, position, sender }`                   | Cursor position   |
| `execute-code-request` | `{ roomId, language, code }`                     | Run code          |

### Server → Client

| Event                                    | Description                           |
| ---------------------------------------- | ------------------------------------- |
| -------                                  | -------------                         |
| `room-participants`                      | List of existing participants on join |
| `user-joined`                            | New participant joined                |
| `user-left`                              | Participant disconnected              |
| `sync-state`                             | Current room state (code, whiteboard) |
| `chat-message`                           | Broadcast chat message                |
| `hand-raise-toggled`                     | Hand raise state change               |
| `webrtc-offer` / `webrtc-answer`         | WebRTC signaling                      |
| `draw-stroke` / `clear-canvas`           | Whiteboard sync                       |
| `code-change` / `code-cursor`            | Code sync                             |
| `execution-started` / `execution-result` | Code execution                        |

## API Endpoints

| Method   | Endpoint                      | Auth   | Description                 |
| -------- | ----------------------------- | ------ | --------------------------- |
| -------- | ----------                    | ------ | -------------               |
| `POST`   | `/api/classrooms/create`      | tutor  | Create new session          |
| `GET`    | `/api/classrooms/my-sessions` | tutor  | List tutor's sessions       |
| `GET`    | `/api/classrooms/active`      | any    | List active sessions        |
| `GET`    | `/api/classrooms/:roomId`     | any    | Get session details         |
| `PATCH`  | `/api/classrooms/:roomId/end` | tutor  | End session + persist state |

## Frontend Routes

| Route                 | Page                | Description                                    |
| --------------------- | ------------------- | ---------------------------------------------- |
| -------               | ------              | -------------                                  |
| `/classrooms`         | ClassroomsDashboard | Create/join sessions, view session list        |
| `/classrooms/:roomId` | ClassroomRoom       | Live classroom with video/chat/whiteboard/code |

## Key Files

```text
client/src/modules/classrooms/
├── pages/
│   ├── ClassroomsDashboard.jsx            # Create/join sessions
│   └── ClassroomRoom.jsx                  # Live classroom (WebRTC + Socket.IO)
├── components/
│   ├── VideoTile.jsx                      # Video stream display
│   ├── Whiteboard.jsx                     # Collaborative drawing
│   └── SharedCodeEditor.jsx               # Monaco collaborative editor
└── services/classroomService.js           # API client

server/src/modules/classrooms/
├── routes.js                              # 5 endpoints
├── controller.js                          # Request handlers
├── service.js                             # DB operations
└── socket.js                              # Socket.IO + room state management
```

## Integration Points

- **Analytics module**: Classroom participation tracked in tutor analytics
- **Notifications**: Session end events can trigger notifications
- **Shared infrastructure**: Uses same Socket.IO server as roadmap and notifications modules
