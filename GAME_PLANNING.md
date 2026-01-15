# Multiplayer Counting Game - Technical Planning Document

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack](#technology-stack)
4. [System Components](#system-components)
5. [Game Mechanics](#game-mechanics)
6. [Data Flow](#data-flow)
7. [API Design](#api-design)
8. [Implementation Phases](#implementation-phases)
9. [Scaling Strategy](#scaling-strategy)
10. [Technical Decisions](#technical-decisions)

---

## Project Overview

### Game Concept
A real-time multiplayer counting game where:
- Players join rooms via a unique room ID
- 10 rounds of gameplay
- Each round: boxes appear on screen → disappear → players count them
- Winner: player with most exact answers after 10 rounds
- No database initially - ephemeral game rooms
- Designed to scale if it goes viral

### Requirements
- ✅ Real-time multiplayer synchronization
- ✅ Three.js for 3D box rendering
- ✅ Scalable architecture (Cloudflare Workers ready)
- ✅ No database (in-memory game state)
- ✅ Room-based gameplay (create/join via ID)
- ✅ Auto-cleanup when players leave

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client 1  │◄───────►│  Game Server │◄───────►│  Client 2   │
│  (React +   │ WebSocket│  (Cloudflare │ WebSocket│  (React +   │
│  Three.js)  │         │   Workers +  │         │  Three.js)  │
│             │         │  Durable Obj │         │             │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              │ HTTP (tRPC)
                              │
                        ┌─────▼─────┐
                        │ Room Mgmt │
                        │ (Create/  │
                        │  Join)    │
                        └───────────┘
```

### Client-Server Communication

**HTTP (tRPC):**
- Create game room
- Join game room
- Get room status/info
- Health checks

**WebSocket:**
- Real-time game state updates
- Player actions (answers, ready status)
- Round progression
- Box visibility sync
- Score updates

---

## Technology Stack

### Frontend
- **React 19** - UI framework
- **Three.js** - 3D graphics rendering
- **TanStack Router** - Client-side routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Styling
- **TypeScript** - Type safety

### Backend
- **TanStack Start** - Full-stack framework
- **Cloudflare Workers** - Serverless runtime
- **Durable Objects** (Phase 5) - Stateful game room instances
- **tRPC** - Type-safe API layer
- **WebSocket API** - Real-time communication

### Development
- **Vite** - Build tool
- **TypeScript** - Type checking
- **ESLint/Prettier** - Code quality

---

## System Components

### 1. Room Manager (HTTP Server)
**Responsibility:** Create and manage game rooms

**Location:** `src/routes/api/game/`

**Endpoints:**
- `POST /api/game/create` - Generate room ID, initialize game state
- `GET /api/game/:roomId/status` - Get current room status
- `POST /api/game/:roomId/join` - Register player in room

**Initial Implementation:** In-memory Map/Dictionary
```typescript
// Pseudo-structure
rooms: Map<roomId, GameRoom>
```

**Future Migration:** Durable Objects namespace

### 2. Game Room (Stateful)
**Responsibility:** Manage game state, players, rounds, synchronization

**State Structure:**
```typescript
interface GameRoom {
  roomId: string
  players: Map<playerId, Player>
  currentRound: number // 0-10 (0 = waiting, 1-10 = rounds)
  gameState: 'waiting' | 'counting' | 'answering' | 'results' | 'finished'
  roundData: {
    boxes: Box[] // Server-generated box positions
    correctCount: number
    startedAt: number // timestamp
  }
  scores: Map<playerId, number>
  websocketConnections: Map<playerId, WebSocket>
  createdAt: number
  lastActivity: number
}
```

**Behaviors:**
- Accept WebSocket connections
- Generate random box configurations
- Manage round timing
- Collect and validate answers
- Calculate scores
- Broadcast state changes
- Cleanup on inactivity/empty

### 3. WebSocket Server
**Responsibility:** Real-time bidirectional communication

**Message Types:**
```typescript
// Client → Server
interface ClientMessages {
  join: { roomId: string, playerName: string }
  answer: { round: number, count: number, timestamp: number }
  ready: { }
  ping: { }
}

// Server → Client
interface ServerMessages {
  playerJoined: { playerId: string, playerName: string, totalPlayers: number }
  playerLeft: { playerId: string, totalPlayers: number }
  gameStarting: { roundCount: number }
  roundStart: { round: number, boxes: Box[] }
  boxesHidden: { round: number }
  roundResults: { round: number, correctCount: number, scores: Score[] }
  gameFinished: { winner: Player, finalScores: Score[] }
  error: { message: string }
  pong: { }
}
```

### 4. Three.js Scene Manager (Client)
**Responsibility:** Render 3D boxes, handle camera, animations

**Components:**
- Scene setup (camera, lights, renderer)
- Box mesh generation
- Animation system (fade in/out, appear/disappear)
- Camera controls (optional: orbit controls for better viewing)
- Responsive rendering

**Location:** `src/components/game/ThreeScene.tsx`

### 5. Game UI (React Client)
**Responsibility:** User interface, state management, WebSocket client

**Components:**
- `LobbyScreen` - Room creation/joining
- `WaitingRoom` - Pre-game lobby
- `GameView` - Main gameplay (Three.js canvas + UI overlay)
- `Scoreboard` - Current scores
- `RoundResults` - Per-round results
- `GameFinished` - Final winner screen

**Location:** `src/routes/game/[roomId].tsx`

---

## Game Mechanics

### Round Structure

**Round Timeline:**
```
0s      → Round starts, boxes appear (fade in animation)
3s      → Boxes visible (players counting)
6s      → Boxes disappear (fade out animation)
6-15s   → Answer collection period
15s     → Round ends, show results
17s     → Next round starts (or game finished)
```

**Box Generation Algorithm:**
- Random number of boxes: 5-15 per round
- Random 3D positions (x, y, z grid-based)
- Avoid overlapping
- Isometric-friendly positioning
- Server generates, clients render identically

### Scoring System
- **Exact match:** +10 points
- **Off by 1:** +5 points
- **Off by 2:** +2 points
- **Other:** 0 points

### Game Flow States
1. **WAITING** - Players joining, waiting for minimum players (2+)
2. **COUNTING** - Boxes visible, players observing
3. **ANSWERING** - Boxes hidden, players submitting answers
4. **RESULTS** - Showing round results and scores
5. **FINISHED** - Game complete, winner declared

### Answer Collection
- Players submit answers within time window (6-15s after boxes disappear)
- Server validates: round number, timestamp, valid number
- First answer per player per round (ignore duplicates)
- Late answers rejected

---

## Data Flow

### Room Creation Flow
```
1. Client: POST /api/game/create
2. Server: Generate unique roomId (e.g., "ABC123")
3. Server: Create GameRoom instance
4. Server: Store in rooms Map
5. Server: Return { roomId, playerId }
6. Client: Redirect to /game/:roomId
7. Client: Establish WebSocket connection
```

### Player Join Flow
```
1. Client: POST /api/game/:roomId/join (or direct WebSocket join)
2. Server: Validate room exists
3. Server: Add player to room.players
4. Server: Broadcast playerJoined to all connected clients
5. Client: Update player list in UI
```

### Round Execution Flow
```
1. Server: GameState → COUNTING
2. Server: Generate box configuration
3. Server: Broadcast roundStart { round, boxes }
4. All Clients: Render boxes (Three.js)
5. Server: Wait 3 seconds
6. Server: Broadcast boxesHidden
7. All Clients: Hide boxes (fade out)
8. Server: GameState → ANSWERING
9. Clients: Show answer input
10. Server: Collect answers (with timestamps)
11. Server: After timeout, calculate scores
12. Server: Broadcast roundResults
13. Server: Update gameState → RESULTS
14. Server: Wait 2 seconds → Next round or FINISHED
```

### WebSocket Connection Management
```
Connection Lifecycle:
1. Client connects → Server accepts
2. Client sends "join" message
3. Server registers WebSocket with playerId
4. Server sends current game state snapshot
5. Bidirectional messages during gameplay
6. On disconnect → Remove player, cleanup if room empty
```

---

## API Design

### tRPC Router Structure
```typescript
// src/integrations/trpc/routers/game.ts
export const gameRouter = router({
  create: publicProcedure
    .output(z.object({ roomId: z.string(), playerId: z.string() }))
    .mutation(async () => { ... }),
    
  join: publicProcedure
    .input(z.object({ roomId: z.string(), playerName: z.string() }))
    .output(z.object({ playerId: z.string(), roomState: roomStateSchema }))
    .mutation(async ({ input }) => { ... }),
    
  status: publicProcedure
    .input(z.object({ roomId: z.string() }))
    .output(roomStateSchema)
    .query(async ({ input }) => { ... }),
})
```

### WebSocket Protocol

**Connection URL:**
```
ws://localhost:3000/ws/game/:roomId
```

**Message Format:**
```typescript
// JSON messages
{
  type: 'join' | 'answer' | 'ready' | 'ping',
  payload: { ... }
}
```

**Error Handling:**
- Invalid room ID → Close connection with error code
- Invalid message format → Send error message, keep connection
- Game state errors → Send error message, allow reconnection

---

## Implementation Phases

### Phase 1: Foundation & Room System
**Goal:** Basic room creation and HTTP API

**Tasks:**
- [ ] Set up game router in tRPC
- [ ] Implement room ID generation (short, unique, URL-friendly)
- [ ] Create in-memory room storage (Map)
- [ ] Implement `create` endpoint
- [ ] Implement `join` endpoint
- [ ] Implement `status` endpoint
- [ ] Add room cleanup timer (inactive rooms)
- [ ] Create basic lobby UI (create/join room)

**Deliverable:** Users can create rooms, join via ID, see room status

### Phase 2: WebSocket Infrastructure
**Goal:** Real-time communication layer

**Tasks:**
- [ ] Set up WebSocket server (Cloudflare Workers compatible)
- [ ] Implement connection handling
- [ ] Create message parsing/serialization
- [ ] Implement connection → room mapping
- [ ] Add heartbeat/ping-pong mechanism
- [ ] Handle disconnections gracefully
- [ ] Create WebSocket client hook (React)

**Deliverable:** Clients can connect, send/receive messages

### Phase 3: Game Logic & State Management
**Goal:** Core game mechanics on server

**Tasks:**
- [ ] Implement GameRoom class/object
- [ ] Add game state machine (waiting → counting → answering → results)
- [ ] Implement box generation algorithm
- [ ] Add round management (10 rounds)
- [ ] Implement answer collection
- [ ] Add scoring system
- [ ] Implement timing logic (3s visible, answer window)
- [ ] Add game finished logic
- [ ] Create server-side game loop

**Deliverable:** Complete game logic, players can play full game

### Phase 4: Three.js Integration
**Goal:** 3D box rendering on client

**Tasks:**
- [ ] Install Three.js dependencies
- [ ] Create Three.js scene component
- [ ] Set up camera (isometric or perspective)
- [ ] Implement box mesh generation
- [ ] Add lighting
- [ ] Implement fade in/out animations
- [ ] Sync box positions from server
- [ ] Add responsive canvas sizing
- [ ] Optimize rendering performance

**Deliverable:** Beautiful 3D boxes render, animate correctly

### Phase 5: UI & Polish
**Goal:** Complete user experience

**Tasks:**
- [ ] Build lobby screen UI
- [ ] Create waiting room (player list)
- [ ] Build game view (Three.js canvas + overlay)
- [ ] Add answer input UI
- [ ] Create scoreboard component
- [ ] Build round results screen
- [ ] Create game finished screen
- [ ] Add loading states
- [ ] Error handling UI
- [ ] Mobile responsiveness
- [ ] Add animations/transitions

**Deliverable:** Polished, playable game

### Phase 6: Testing & Optimization
**Goal:** Stability and performance

**Tasks:**
- [ ] Unit tests for game logic
- [ ] Integration tests for WebSocket flow
- [ ] Load testing (multiple rooms)
- [ ] Fix memory leaks
- [ ] Optimize Three.js rendering
- [ ] Add error boundaries
- [ ] Performance profiling
- [ ] Browser compatibility testing

**Deliverable:** Stable, performant game

### Phase 7: Durable Objects Migration (Optional/Future)
**Goal:** Production scalability

**Tasks:**
- [ ] Design Durable Objects structure
- [ ] Migrate GameRoom to Durable Object class
- [ ] Update WebSocket handling for DO
- [ ] Test horizontal scaling
- [ ] Monitor performance
- [ ] Update deployment config

**Deliverable:** Scalable architecture ready for viral traffic

---

## Scaling Strategy

### Current Architecture (In-Memory)
**Limitations:**
- Single worker instance
- ~100-1000 concurrent rooms per instance
- State lost on worker restart
- Not horizontally scalable

**Good For:**
- MVP/prototype
- Small-scale testing
- Development

### Target Architecture (Durable Objects)
**Benefits:**
- Horizontal scaling (unlimited instances)
- Stateful per-room instances
- Automatic load distribution
- Persistent state (survives restarts)
- Low latency (routed to correct instance)

**Migration Path:**
1. Keep API compatible
2. Extract GameRoom logic to DO class
3. Update WebSocket routing
4. Deploy and test
5. Gradually migrate traffic

### Scaling Considerations

**Room Limits:**
- Maximum players per room: 8-10 (prevent cheating/collusion)
- Room timeout: 30 minutes inactivity
- Max rooms per instance: Monitor and adjust

**Performance Optimizations:**
- Batch WebSocket broadcasts
- Debounce state updates
- Use object pooling for Three.js meshes
- Implement message queuing for slow clients

**Monitoring:**
- Track active rooms
- Monitor WebSocket connections
- Track message latency
- Memory usage per room
- Error rates

---

## Technical Decisions

### Why Cloudflare Workers + Durable Objects?
- **Serverless:** No server management
- **Global edge:** Low latency worldwide
- **Cost-effective:** Pay per request/room
- **Scalable:** Handles viral traffic
- **WebSocket support:** Native support
- **TypeScript:** Full type safety

### Why Three.js?
- Industry standard 3D library
- Great documentation
- Active community
- Works well with React
- WebGL/WebGPU support
- Performance optimizations built-in

### Why tRPC for HTTP?
- Already in stack
- Type-safe end-to-end
- Great DX
- Compatible with TanStack Start

### Why In-Memory First?
- Faster development
- Easier debugging
- No infrastructure complexity
- Validate game mechanics
- Migrate to DO when proven

### Room ID Generation
**Format:** 6-character alphanumeric (e.g., "ABC123")
- Easy to share (voice, text)
- Sufficient entropy (36^6 = ~2 billion combinations)
- URL-friendly
- Human-readable

**Implementation:**
```typescript
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
```

### Answer Validation Strategy
- Validate round number matches current round
- Validate timestamp within answer window
- Only accept first answer per player per round
- Reject invalid numbers (negative, too large)
- Store answers with timestamps for debugging

### Box Generation Strategy
**Constraints:**
- Count: 5-15 boxes per round
- Grid-based positions (avoid floating decimals)
- Minimum distance between boxes
- Isometric-friendly layout

**Algorithm:**
1. Generate random count (5-15)
2. Create 3D grid (e.g., 8x8x4)
3. Randomly place boxes avoiding overlaps
4. Store positions as array of {x, y, z}
5. Send to clients for rendering

---

## File Structure

```
src/
├── routes/
│   ├── game/
│   │   ├── [roomId].tsx          # Main game route
│   │   └── create.tsx             # Room creation page
│   └── api/
│       └── game/
│           └── ws.ts              # WebSocket endpoint
├── components/
│   └── game/
│       ├── LobbyScreen.tsx
│       ├── WaitingRoom.tsx
│       ├── GameView.tsx
│       ├── ThreeScene.tsx         # Three.js wrapper
│       ├── Scoreboard.tsx
│       ├── AnswerInput.tsx
│       └── RoundResults.tsx
├── lib/
│   ├── game/
│   │   ├── types.ts               # Shared types
│   │   ├── room.ts                # Room management
│   │   ├── gameLogic.ts           # Game state machine
│   │   ├── boxGenerator.ts        # Box generation
│   │   └── scoring.ts             # Scoring logic
│   └── websocket/
│       ├── client.ts              # WebSocket client
│       └── messages.ts            # Message types
├── integrations/
│   └── trpc/
│       └── routers/
│           └── game.ts            # Game tRPC router
└── hooks/
    ├── useGameRoom.ts             # Game room state hook
    └── useWebSocket.ts            # WebSocket hook
```

---

## Next Steps

1. **Review this document** - Ensure alignment on approach
2. **Start Phase 1** - Begin with room system
3. **Iterate** - Build incrementally, test frequently
4. **Gather feedback** - Test with real users early
5. **Refine** - Adjust based on gameplay experience

---

## Questions to Consider

- [ ] Minimum players to start game? (Recommendation: 2)
- [ ] Maximum players per room? (Recommendation: 8-10)
- [ ] Round timing (3s visible, answer window duration)?
- [ ] Should players see each other's answers in real-time?
- [ ] Allow spectators/observers?
- [ ] Add player names or anonymous?
- [ ] Mobile support priority?
- [ ] Add sound effects/music?

---

**Document Version:** 1.0  
**Last Updated:** Initial creation  
**Status:** Planning Phase
