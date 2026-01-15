# Next Steps - Progress Tracker

This document tracks the implementation progress of the multiplayer counting game. Check off items as you complete them!

**Last Updated:** Initial creation

---

## Phase 1: Foundation & Room System

### 1.1 Type Definitions
- [X] Create `src/lib/game/types.ts`
  - [X] Define `Box` interface (x, y, z positions)
  - [X] Define `Player` interface (id, name, score)
  - [X] Define `GameState` type union ('waiting' | 'counting' | 'answering' | 'results' | 'finished')
  - [X] Define `GameRoom` interface (roomId, players, currentRound, gameState, roundData, scores, etc.)
  - [X] Define `RoundData` interface
  - [X] Export all types

### 1.2 Room Utilities
- [X] Create `src/lib/game/room.ts`
  - [X] Implement `generateRoomId()` function (6-char alphanumeric)
  - [X] Test room ID generation (uniqueness, format)
  - [X] Create `RoomManager` class
  - [X] Implement `createRoom()` method
  - [X] Implement `getRoom(roomId)` method
  - [X] Implement `deleteRoom(roomId)` method
  - [X] Add room cleanup timer logic (inactive rooms)

### 1.3 tRPC Game Router
- [X] Create `src/integrations/trpc/routers/game.ts`
  - [X] Set up game router structure
  - [X] Implement `create` mutation
    - [X] Generate room ID
    - [X] Create initial GameRoom instance
    - [X] Store in RoomManager
    - [X] Return `{ roomId, playerId }`
  - [X] Implement `join` mutation
    - [X] Validate room exists
    - [X] Add player to room
    - [X] Return `{ playerId, roomState }`
  - [X] Implement `status` query
    - [X] Get room by ID
    - [X] Return room state (or error if not found)
  - [X] Add input/output validation with Zod schemas

### 1.4 Basic UI - Lobby
- [ ] Create `src/routes/game/create.tsx`
  - [ ] Add "Create Room" button
  - [ ] Call `create` mutation
  - [ ] Display room ID
  - [ ] Add "Copy Room ID" functionality
  - [ ] Add link/redirect to join page
- [ ] Create `src/routes/game/join.tsx` (or add to create page)
  - [ ] Add input field for room ID
  - [ ] Add "Join Room" button
  - [ ] Call `join` mutation
  - [ ] Handle errors (room not found, etc.)
  - [ ] Redirect to game room on success

### 1.5 Testing Phase 1
- [ ] Test room creation (multiple rooms, unique IDs)
- [ ] Test room joining (valid/invalid room IDs)
- [ ] Test room status endpoint
- [ ] Test room cleanup (inactive rooms)
- [ ] Verify no memory leaks

**Phase 1 Status:** ⬜ Not Started

---

## Phase 2: WebSocket Infrastructure

### 2.1 WebSocket Server Setup
- [ ] Research Cloudflare Workers WebSocket API
- [ ] Create `src/routes/api/game/ws.ts` (or appropriate endpoint)
  - [ ] Set up WebSocket upgrade handler
  - [ ] Handle connection acceptance
  - [ ] Map connections to rooms

### 2.2 Message Protocol
- [ ] Create `src/lib/websocket/messages.ts`
  - [ ] Define `ClientMessage` types (join, answer, ready, ping)
  - [ ] Define `ServerMessage` types (playerJoined, playerLeft, gameStarting, etc.)
  - [ ] Create message parsing/serialization functions
  - [ ] Add type guards for message validation

### 2.3 Connection Management
- [ ] Implement connection → room mapping
- [ ] Store WebSocket connections in GameRoom
- [ ] Handle connection lifecycle (connect, disconnect)
- [ ] Implement heartbeat/ping-pong mechanism
- [ ] Handle disconnections gracefully (remove player, cleanup)

### 2.4 WebSocket Client (React)
- [ ] Create `src/hooks/useWebSocket.ts`
  - [ ] Manage WebSocket connection state
  - [ ] Handle connection/reconnection logic
  - [ ] Send messages helper function
  - [ ] Receive messages and update state
  - [ ] Handle errors and connection issues

### 2.5 Testing Phase 2
- [ ] Test WebSocket connection (single client)
- [ ] Test multiple clients connecting to same room
- [ ] Test message sending/receiving
- [ ] Test disconnection handling
- [ ] Test ping-pong heartbeat

**Phase 2 Status:** ⬜ Not Started

---

## Phase 3: Game Logic & State Management

### 3.1 Game Room Logic
- [ ] Create `src/lib/game/gameLogic.ts`
  - [ ] Implement game state machine
  - [ ] Add state transition functions
  - [ ] Implement round management (10 rounds)
  - [ ] Add timing logic (3s visible, answer window)

### 3.2 Box Generation
- [ ] Create `src/lib/game/boxGenerator.ts`
  - [ ] Implement box generation algorithm
  - [ ] Generate random count (5-15 boxes)
  - [ ] Create 3D grid-based positions
  - [ ] Avoid overlapping boxes
  - [ ] Return array of Box positions

### 3.3 Answer Collection
- [ ] Implement answer validation
  - [ ] Validate round number matches
  - [ ] Validate timestamp within window
  - [ ] Only accept first answer per player per round
  - [ ] Reject invalid numbers
- [ ] Store answers with timestamps

### 3.4 Scoring System
- [ ] Create `src/lib/game/scoring.ts`
  - [ ] Implement scoring function
  - [ ] Exact match: +10 points
  - [ ] Off by 1: +5 points
  - [ ] Off by 2: +2 points
  - [ ] Other: 0 points
  - [ ] Calculate round scores
  - [ ] Update player total scores

### 3.5 Game Loop
- [ ] Implement server-side game loop
  - [ ] Start game when minimum players (2+)
  - [ ] Round progression logic
  - [ ] Box visibility timing
  - [ ] Answer collection window
  - [ ] Results calculation and broadcast
  - [ ] Game finished logic (after 10 rounds)

### 3.6 Testing Phase 3
- [ ] Test box generation (count, positions, no overlaps)
- [ ] Test scoring system (all cases)
- [ ] Test answer validation
- [ ] Test game state transitions
- [ ] Test full game flow (10 rounds)

**Phase 3 Status:** ⬜ Not Started

---

## Phase 4: Three.js Integration

### 4.1 Setup
- [ ] Install Three.js dependencies (`three`, `@react-three/fiber`, `@react-three/drei`)
- [ ] Research React Three Fiber (if using)

### 4.2 Scene Component
- [ ] Create `src/components/game/ThreeScene.tsx`
  - [ ] Set up Three.js scene
  - [ ] Configure camera (isometric or perspective)
  - [ ] Add lighting
  - [ ] Create renderer and canvas

### 4.3 Box Rendering
- [ ] Implement box mesh generation
  - [ ] Create box geometry
  - [ ] Add materials/textures
  - [ ] Position boxes from server data
  - [ ] Handle box updates

### 4.4 Animations
- [ ] Implement fade in animation (boxes appear)
- [ ] Implement fade out animation (boxes disappear)
- [ ] Add smooth transitions
- [ ] Optimize animation performance

### 4.5 Camera & Controls
- [ ] Set up camera positioning
- [ ] (Optional) Add orbit controls for better viewing
- [ ] Make responsive to window size
- [ ] Handle canvas resizing

### 4.6 Testing Phase 4
- [ ] Test box rendering (static boxes)
- [ ] Test animations (fade in/out)
- [ ] Test with different box counts
- [ ] Test responsive sizing
- [ ] Performance check (FPS, memory)

**Phase 4 Status:** ⬜ Not Started

---

## Phase 5: UI & Polish

### 5.1 Game Route
- [ ] Create `src/routes/game/[roomId].tsx`
  - [ ] Handle room ID from URL
  - [ ] Connect WebSocket on mount
  - [ ] Render appropriate screen based on game state

### 5.2 Waiting Room Component
- [ ] Create `src/components/game/WaitingRoom.tsx`
  - [ ] Display player list
  - [ ] Show room ID
  - [ ] Show "Waiting for players..." message
  - [ ] Display minimum players requirement

### 5.3 Game View Component
- [ ] Create `src/components/game/GameView.tsx`
  - [ ] Integrate ThreeScene component
  - [ ] Add UI overlay (scoreboard, round info)
  - [ ] Show current round number
  - [ ] Display timer/countdown

### 5.4 Answer Input
- [ ] Create `src/components/game/AnswerInput.tsx`
  - [ ] Number input field
  - [ ] Submit button
  - [ ] Disable after submission
  - [ ] Show "Answer submitted" confirmation

### 5.5 Scoreboard
- [ ] Create `src/components/game/Scoreboard.tsx`
  - [ ] Display all players
  - [ ] Show current scores
  - [ ] Highlight current leader
  - [ ] Update in real-time

### 5.6 Round Results
- [ ] Create `src/components/game/RoundResults.tsx`
  - [ ] Show correct answer
  - [ ] Display each player's answer
  - [ ] Show points earned this round
  - [ ] Update total scores

### 5.7 Game Finished
- [ ] Create `src/components/game/GameFinished.tsx`
  - [ ] Display winner
  - [ ] Show final scores (all players)
  - [ ] Add "Play Again" or "New Room" button

### 5.8 Polish
- [ ] Add loading states
- [ ] Add error handling UI
- [ ] Add error boundaries
- [ ] Mobile responsiveness
- [ ] Add animations/transitions
- [ ] Improve styling (Tailwind)

### 5.9 Testing Phase 5
- [ ] Test full user flow (create → join → play → finish)
- [ ] Test with multiple players
- [ ] Test error scenarios
- [ ] Test on mobile devices
- [ ] Test UI responsiveness

**Phase 5 Status:** ⬜ Not Started

---

## Phase 6: Testing & Optimization

### 6.1 Unit Tests
- [ ] Test room ID generation
- [ ] Test box generation algorithm
- [ ] Test scoring system
- [ ] Test answer validation
- [ ] Test game state machine

### 6.2 Integration Tests
- [ ] Test WebSocket flow (connect → join → play)
- [ ] Test tRPC endpoints
- [ ] Test full game flow

### 6.3 Load Testing
- [ ] Test multiple rooms simultaneously
- [ ] Test multiple players per room
- [ ] Monitor memory usage
- [ ] Check for memory leaks

### 6.4 Performance Optimization
- [ ] Optimize Three.js rendering
- [ ] Fix any memory leaks
- [ ] Optimize WebSocket message handling
- [ ] Performance profiling
- [ ] Browser compatibility testing

**Phase 6 Status:** ⬜ Not Started

---

## Phase 7: Durable Objects Migration (Future/Optional)

### 7.1 Design
- [ ] Design Durable Objects structure
- [ ] Plan migration strategy
- [ ] Update architecture docs

### 7.2 Implementation
- [ ] Create Durable Object class
- [ ] Migrate GameRoom logic to DO
- [ ] Update WebSocket handling
- [ ] Update deployment config

### 7.3 Testing
- [ ] Test horizontal scaling
- [ ] Monitor performance
- [ ] Verify state persistence

**Phase 7 Status:** ⬜ Not Started (Future)

---

## Notes & Decisions

### Decisions Made
- [ ] Minimum players to start: ___ (Recommendation: 2)
- [ ] Maximum players per room: ___ (Recommendation: 8-10)
- [ ] Round timing confirmed: 3s visible, ___s answer window
- [ ] Player names: Anonymous or named? ___
- [ ] Mobile support priority: High/Medium/Low

### Issues & Blockers
- _Add issues as they come up_

### Questions
- _Add questions that need answers_

---

## Quick Reference

**Current Focus:** Phase 1 - Foundation & Room System

**Next Immediate Steps:**
1. Create `src/lib/game/types.ts` with all type definitions
2. Implement `generateRoomId()` function
3. Create `RoomManager` class
4. Set up tRPC game router with `create` endpoint
5. Build simple UI to test room creation

**Key Files to Create:**
- `src/lib/game/types.ts`
- `src/lib/game/room.ts`
- `src/integrations/trpc/routers/game.ts`
- `src/routes/game/create.tsx`
- `src/routes/game/[roomId].tsx`
