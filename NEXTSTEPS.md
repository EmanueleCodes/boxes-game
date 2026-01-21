# Next Steps - Progress Tracker

This document tracks the implementation progress of the multiplayer counting game.

**Last Updated:** Reorganized into single pipeline

---

## Current Status

| Phase | Status | Notes |
|-------|--------|-------|
| 1. Foundation & Room System | ✅ Complete | Rooms, players, tRPC API |
| 2. Real-time Infrastructure | ✅ Complete | Polling (2s), WebSocket deferred to Durable Objects |
| 3. Game Logic | 🟡 Partial | State machine + box generation done |
| 4. Three.js Rendering | ✅ Complete | Isometric 3D box view |
| 5. Game Flow & UI | ⬜ Not Started | **← Next Priority**: Answer input, results, scoring |
| 6. Polish & Testing | ⬜ Not Started | |
| 7. Durable Objects + WebSocket | ⬜ Future | For true real-time |

**Deployment:** ✅ Live at https://tanstack-start-app.emanuelecodes.workers.dev

---

## Implementation Pipeline

### Phase 1: Foundation & Room System ✅ COMPLETE

- [x] Type definitions (`src/lib/types.ts`)
- [x] Room utilities (`src/lib/game/room.ts`)
- [x] tRPC game router - create, join, status (`src/integrations/trpc/routers/game.ts`)
- [x] Create room UI (`src/routes/game/create.tsx`)
- [x] Join room UI (`src/routes/game/join.tsx`)
- [x] Waiting room UI (`src/routes/game/$roomId.tsx`)
- [x] Deployed to Cloudflare Workers

---

### Phase 2: Real-time Infrastructure ✅ COMPLETE

- [x] WebSocket server handler (`src/routes/api/game/ws.$roomId.tsx`)
- [x] Message protocol (`src/lib/websocket/messages.ts`)
- [x] WebSocket client hook (`src/hooks/useWebSocket.ts`)
- [x] **Decision:** Use polling (2s) for now - WebSocket requires Durable Objects for stateful connections
- [x] Polling works identically in dev and production

---

### Phase 3: Game Logic ✅ PARTIAL

**Done:**
- [x] Game state machine (`src/lib/game/gameLogic.ts`)
  - [x] `canStartGame()`, `startGame()`, `startRound()`
  - [x] `transitionToAnswering()`, `transitionToResults()`, `nextRound()`
- [x] Box generation system (`src/lib/game/boxGenerator.ts`)
  - [x] Pattern-based generation (simpleStatic, slidingPlane, snakeStaggered)
  - [x] Difficulty scaling by round
- [x] Game start trigger - `game.start` tRPC mutation exists and works

**Not done (moved to Phase 5):**
- [ ] Answer collection
- [ ] Scoring system
- [ ] Round timing automation

---

### Phase 4: Three.js Box Rendering ✅ COMPLETE

**Goal:** Render boxes in 3D isometric view (like Figma reference)

#### 4.1 Setup
- [x] Install dependencies: `three`, `@react-three/fiber`, `@react-three/drei`

#### 4.2 Box Renderer Component
**File:** `src/components/game/BoxRenderer.tsx`

- [x] Create Three.js canvas with React Three Fiber
- [x] Set up isometric camera (OrthographicCamera at 45° angle)
- [x] Render boxes from `roundData.boxes` array
- [x] Style: light gray boxes with darker edges (match Figma)
- [x] Add ground plane and grid for reference

#### 4.3 Integrate into Game Room
**File:** `src/routes/game/$roomId.tsx`

- [x] When `gameState === 'started'` and `roundState === 'showingBoxes'`:
  - Show BoxRenderer with boxes from `roundData.boxes`
  - Show round number and countdown timer
- [x] GameView component handles round state switching
- [x] Scoreboard shows during active game

---

### Phase 5: Game Flow & Answer UI ⬜

**Goal:** Complete single round: show boxes → answer → results

#### 5.1 Answer Input Component
**File:** `src/components/game/AnswerInput.tsx`

- [ ] Large number input field
- [ ] Submit button
- [ ] Disable after submission
- [ ] Visual feedback on submit

#### 5.2 Answer Collection (Backend)
**File:** `src/lib/types.ts` + `src/integrations/trpc/routers/game.ts`

- [ ] Add `roundAnswers: Map<playerId, { count: number, timestamp: number }>` to GameRoom
- [ ] Create `game.submitAnswer` tRPC mutation
  - Validate: correct round, player exists, not already answered
  - Store answer in roundAnswers

#### 5.3 Round Timing
**File:** `src/integrations/trpc/routers/game.ts`

- [ ] After `startRound()` → schedule transition after `visibleDuration`
- [ ] Auto-transition: `showingBoxes` → `answering` after timer
- [ ] Auto-transition: `answering` → `showResults` after 10s or all answered

#### 5.4 Scoring System
**File:** `src/lib/game/scoring.ts`

- [ ] Exact match: +10 points
- [ ] Off by 1: +5 points
- [ ] Off by 2: +2 points
- [ ] Other: 0 points

#### 5.5 Results Display
**File:** `src/components/game/RoundResults.tsx`

- [ ] Show correct answer
- [ ] Show player's answer
- [ ] Show points earned
- [ ] "Next Round" or "Game Over" button

#### 5.6 Game View Container
**File:** `src/components/game/GameView.tsx`

- [ ] Switch UI based on `roundState`:
  - `showingBoxes` → BoxRenderer + timer
  - `answering` → AnswerInput
  - `showResults` → RoundResults
- [ ] Display scoreboard sidebar

---

### Phase 6: Polish & Testing ⬜

- [ ] Scoreboard component (live scores during game)
- [ ] Game finished screen (winner, final scores)
- [ ] Loading states
- [ ] Error handling UI
- [ ] Mobile responsiveness
- [ ] Sound effects (optional)
- [ ] Full 10-round game test

---

### Phase 7: Durable Objects + WebSocket ⬜ FUTURE

**Why:** Cloudflare Workers are stateless. Each request can hit a different isolate with no shared memory. Durable Objects provide:
- Persistent state per room
- True WebSocket connections (not polling)
- Instant updates (<100ms vs 2s polling)

**When:** After core gameplay is solid. Polling works fine for MVP.

- [ ] Design Durable Object class structure
- [ ] Migrate room state to Durable Objects
- [ ] Enable WebSocket connections
- [ ] Remove polling fallback

---

## Technical Reference

### Box Data Structure
```typescript
interface Box {
  x: number
  y: number  
  z: number
  size: number
  color: string
}
```

### Round Data (populated by startRound)
```typescript
room.roundData = {
  boxes: Box[]
  correctCount: number
  startedAt: number
  animation: {
    type: 'static' | 'slide' | 'stagger' | 'fade'
    visibleDuration: number // ms
  }
}
```

### Game States
```
GameState: 'notStarted' → 'started' → 'finished'
RoundState: 'notStarted' → 'showingBoxes' → 'answering' → 'showResults'
```

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/types.ts` | All TypeScript interfaces |
| `src/lib/game/room.ts` | RoomManager singleton |
| `src/lib/game/gameLogic.ts` | State transitions |
| `src/lib/game/boxGenerator.ts` | Pattern-based box generation |
| `src/integrations/trpc/routers/game.ts` | tRPC API endpoints |
| `src/routes/game/$roomId.tsx` | Main game room UI |

---

## Decisions Log

| Decision | Choice | Reason |
|----------|--------|--------|
| Real-time method | Polling (2s) | WebSocket needs Durable Objects |
| Min players | 2 | Simple multiplayer |
| Rounds | 10 | Standard game length |
| Box visibility | Pattern-based (1.5-3s) | Difficulty scaling |
| Dev/Prod parity | Same behavior | Polling works everywhere |
