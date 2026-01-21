# Next Steps - Progress Tracker

This document tracks the implementation progress of the multiplayer counting game. Check off items as you complete them!

**Last Updated:** After box generation system + assessment of current state

---

## Phase 1: Foundation & Room System

### 1.1 Type Definitions
- [X] Create `src/lib/game/types.ts`
  - [X] Define `Box` interface (x, y, z positions)
  - [X] Define `Player` interface (id, name, score)
  - [X] Define `GameState` type union ('notStarted' | 'started' | 'finished')
  - [X] Define `RoundState` type union ('notStarted' | 'showingBoxes' | 'answering' | 'showResults')
  - [X] Define `GameRoom` interface (roomId, players, currentRound, gameState, roundState, roundData, scores, etc.)
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
- [X] Create `src/routes/game/create.tsx`
  - [X] Add "Create Room" button
  - [X] Call `create` mutation
  - [X] Display room ID
  - [X] Add "Copy Room ID" functionality
  - [X] Add player name input
  - [X] Redirect to game room on success
- [X] Create `src/routes/game/join.tsx`
  - [X] Add input field for room ID
  - [X] Add input field for player name
  - [X] Add "Join Room" button
  - [X] Call `join` mutation
  - [X] Handle errors (room not found, etc.)
  - [X] Redirect to game room on success
- [X] Create `src/routes/game/$roomId.tsx` (waiting room)
  - [X] Display room ID
  - [X] Show player list
  - [X] Show game status
  - [X] Real-time updates via WebSocket (or polling in dev)
  - [X] Connection status indicator

### 1.5 Testing Phase 1
- [ ] Test room creation (multiple rooms, unique IDs)
- [ ] Test room joining (valid/invalid room IDs)
- [ ] Test room status endpoint
- [ ] Test room cleanup (inactive rooms)
- [ ] Verify no memory leaks

**Phase 1 Status:** ✅ **COMPLETED** (Testing optional)

---

## Phase 2: WebSocket Infrastructure

### 2.1 WebSocket Server Setup
- [X] Research Cloudflare Workers WebSocket API
- [X] Create `src/routes/api/game/ws.$roomId.tsx`
  - [X] Set up WebSocket upgrade handler
  - [X] Handle connection acceptance (WebSocketPair)
  - [X] Map connections to rooms
  - [X] Handle Cloudflare Workers specific types

### 2.2 Message Protocol
- [X] Create `src/lib/websocket/messages.ts`
  - [X] Define `ClientMessage` types (join, answer, ready, ping)
  - [X] Define `ServerMessage` types (playerJoined, playerLeft, gameStarting, roundStart, etc.)
  - [X] Create message parsing/serialization functions
  - [X] Add type guards for message validation
  - [X] Use discriminated unions for type safety

### 2.3 Connection Management
- [X] Implement connection → room mapping
- [X] Store WebSocket connections in GameRoom
- [X] Handle connection lifecycle (connect, disconnect)
- [X] Implement heartbeat/ping-pong mechanism
- [X] Handle disconnections gracefully (remove player, cleanup)
- [X] Broadcast playerJoined/playerLeft messages

### 2.4 WebSocket Client (React)
- [X] Create `src/hooks/useWebSocket.ts`
  - [X] Manage WebSocket connection state
  - [X] Handle connection/reconnection logic
  - [X] Send messages helper functions (sendJoin, sendPing, sendReady, sendAnswer)
  - [X] Receive messages and update state
  - [X] Handle errors and connection issues
  - [X] Auto-send join message on connection
  - [X] Ping/pong heartbeat mechanism

### 2.5 Testing Phase 2
- [ ] Test WebSocket connection (single client)
- [ ] Test multiple clients connecting to same room
- [ ] Test message sending/receiving
- [ ] Test disconnection handling
- [ ] Test ping-pong heartbeat

### 2.6 Cloudflare Deployment & WebSocket Verification
- [ ] **Deployment Setup**
  - [ ] Verify `wrangler.jsonc` configuration (compatibility flags, main entry)
  - [ ] Check Cloudflare account is linked (`wrangler login` or `wrangler whoami`)
  - [ ] Verify build process works (`npm run build`)
  - [ ] Test deployment to staging/preview (`wrangler deploy --env preview` or similar)
  - [ ] Verify deployment to production (`npm run deploy` or `wrangler deploy`)
- [ ] **Environment Configuration**
  - [ ] Document any required environment variables
  - [ ] Set production environment variables in Cloudflare dashboard if needed
  - [ ] Verify `nodejs_compat` flag is set in `wrangler.jsonc` (for WebSocket support)
  - [ ] Check compatibility date is recent enough for WebSocket API
- [ ] **WebSocket Testing in Production**
  - [ ] Test WebSocket connection from browser (verify connection establishes)
  - [ ] Test multiple clients connecting to same room simultaneously
  - [ ] Test message sending (join, ping, ready messages)
  - [ ] Test message receiving (playerJoined, playerLeft broadcasts)
  - [ ] Test real-time updates (player list updates when someone joins/leaves)
  - [ ] Test disconnection handling (close browser tab → verify player removed)
  - [ ] Test ping-pong heartbeat (verify connection stays alive)
- [ ] **Production Debugging**
  - [ ] Add production logging for WebSocket events (connection, disconnect, errors)
  - [ ] Verify error handling works (invalid messages, room not found, etc.)
  - [ ] Test with multiple rooms active simultaneously
  - [ ] Monitor Cloudflare Workers logs for errors
- [ ] **Verification Checklist**
  - [ ] ✅ Players can create rooms
  - [ ] ✅ Players can join rooms via room ID
  - [ ] ✅ Real-time player list updates when someone joins
  - [ ] ✅ Real-time player list updates when someone leaves/closes tab
  - [ ] ✅ Connection status indicator shows "connected" in production
  - [ ] ✅ WebSocket messages are received in real-time (no polling needed)
  - [ ] ✅ Disconnection properly removes players from waiting rooms
  - [ ] ✅ Disconnection properly marks players inactive during active games

**Phase 2 Status:** ✅ **COMPLETED** (Infrastructure done, Production testing pending)
**Note:** WebSocket infrastructure is complete, but requires Cloudflare deployment for full testing. Dev mode uses polling fallback (2s interval) since WebSocket API not supported in TanStack Start dev server.

---

## Phase 3: Game Logic & State Management

### 3.1 Game Room Logic
- [X] Create `src/lib/game/gameLogic.ts`
  - [X] Implement game state machine (GameState + RoundState separation)
  - [X] Add `canStartGame()` function
  - [X] Add `startGame()` function (transitions to 'started', initializes round 1)
  - [X] Add `startRound()` function (generates boxes, sets roundState to 'showingBoxes')
  - [X] Add `transitionToAnswering()` function (showingBoxes → answering)
  - [X] Add `transitionToResults()` function (answering → showResults)
  - [X] Add `nextRound()` function (increments round or finishes game)
  - [ ] **TODO:** Integrate with actual game flow (timing, triggers)
  - [ ] **TODO:** Add timing logic (3s visible, answer window)

### 3.2 Box Generation
- [X] Create `src/lib/game/boxGenerator.ts`
  - [X] Implement pattern-based box generation system
  - [X] Create `BoxGroup` interface (boxes + animation metadata)
  - [X] Implement pattern selector (difficulty-based)
  - [X] Create `simpleStatic` pattern (4 boxes, static, 3s)
  - [X] Create `slidingPlane` pattern (5 boxes, sliding, 2s)
  - [X] Create `snakeStaggered` pattern (9 boxes, staggered, 1.5s)
  - [X] Integrate with `startRound()` in gameLogic
  - [ ] **Future:** Add more patterns (pyramid, grid, etc.)

### 3.3 Answer Collection
- [ ] **Add answer storage to GameRoom** (in `types.ts`)
  - [ ] Add `roundAnswers: Map<string, { count: number, timestamp: number }>` to GameRoom
  - [ ] Reset answers at start of each round
- [ ] **Implement answer validation** (in `gameLogic.ts` or new `answerCollection.ts`)
  - [ ] Create `submitAnswer(room, playerId, round, count)` function
  - [ ] Validate round number matches current round
  - [ ] Validate timestamp within answer window
  - [ ] Only accept first answer per player per round (check if already answered)
  - [ ] Reject invalid numbers (negative, NaN, etc.)
  - [ ] Store valid answers in `roundAnswers` map
- [ ] **Integrate with WebSocket handler** (in `ws.$roomId.tsx`)
  - [ ] Handle `answer` message in `handleMessage()`
  - [ ] Call `submitAnswer()` with validation
  - [ ] Broadcast `answerReceived` message (optional, for UI feedback)
  - [ ] Reject invalid answers with error message

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
- [ ] **Game Start Trigger** (first step - unblocks waiting room)
  - [ ] Add "Start Game" button to waiting room UI (`$roomId.tsx`)
  - [ ] Create tRPC mutation `game.start` OR handle via WebSocket `ready` message
  - [ ] When all players ready OR creator clicks "Start" → call `startGame(room)`
  - [ ] Broadcast `gameStarting` message to all clients
  - [ ] **ALTERNATIVE:** Auto-start after 3 seconds when 2+ players ready
- [ ] **Round Execution with Timing** (core game loop)
  - [ ] After `startGame()` → immediately call `startRound(room)`
  - [ ] Broadcast `roundStart` message with boxes data
  - [ ] Set timer for `roundData.animation.visibleDuration` (varies by pattern)
  - [ ] After timer → call `transitionToAnswering(room)` → broadcast `boxesHidden`
  - [ ] Set timer for answer collection window (e.g., 10 seconds)
  - [ ] After timer OR all players answered → calculate scores → `transitionToResults(room)`
  - [ ] Broadcast `roundResults` with scores
  - [ ] After 3 seconds → call `nextRound(room)` OR `gameFinished` if round 10
  - [ ] If more rounds → repeat from `startRound()`
  - [ ] If finished → broadcast `gameFinished` message
- [ ] **Integration Points**
  - [ ] Use `roundData.animation.visibleDuration` for timing (varies per pattern)
  - [ ] Integrate answer collection (3.3) - check if all answered before timeout
  - [ ] Integrate scoring (3.4) - calculate after answer window closes

### 3.6 Testing Phase 3
- [ ] Test box generation (count, positions, no overlaps)
- [ ] Test scoring system (all cases)
- [ ] Test answer validation
- [ ] Test game state transitions
- [ ] Test full game flow (10 rounds)

**Phase 3 Status:** 🟡 **IN PROGRESS** (3.1-3.2 done, 3.3-3.6 remaining)

**Assessment:**
- ✅ State machine complete and working
- ✅ Box generation complete and integrated
- ❌ **BLOCKER:** No game start trigger - players stuck on "Ready to start!" message
- ❌ Answer collection not implemented (WebSocket `answer` handler exists but doesn't process)
- ❌ Scoring not implemented
- ❌ Game loop timing not implemented (rounds don't progress)

**Next Priority:** Implement game start trigger (3.5a) to unblock waiting room → enables basic gameplay testing

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
- [X] Create `src/routes/game/$roomId.tsx` (waiting room view)
  - [X] Handle room ID from URL
  - [X] Connect WebSocket on mount (or polling in dev)
  - [X] Render waiting room UI
  - [ ] **TODO:** Render game view when gameState === 'started'
  - [ ] **TODO:** Render different screens based on roundState

### 5.2 Waiting Room Component
- [X] Waiting room UI implemented in `$roomId.tsx`
  - [X] Display player list
  - [X] Show room ID
  - [X] Show "Waiting for players..." message
  - [X] Display minimum players requirement
  - [X] Real-time player updates

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

**Phase 5 Status:** 🟡 **IN PROGRESS** (5.1-5.2 done, rest remaining)

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
- [X] Minimum players to start: **2** ✅
- [ ] Maximum players per room: ___ (Recommendation: 8-10)
- [ ] Round timing confirmed: 3s visible, ___s answer window
- [X] Player names: **Named** (required on create/join) ✅
- [ ] Mobile support priority: High/Medium/Low
- [X] State structure: **Separated GameState (notStarted/started/finished) and RoundState (notStarted/showingBoxes/answering/showResults)** ✅
- [X] Dev mode: **WebSocket disabled, using polling** (Cloudflare Workers WebSocket not fully supported in local dev) ✅
- [X] Disconnection handling: **Remove players during 'notStarted', mark inactive during active games** ✅
- [ ] Deployment: **Ready for Cloudflare deployment - WebSocket testing requires production environment** ⏳

### Issues & Blockers
- **WebSocket in Dev Mode:** WebSocket connections cannot be tested locally - TanStack Start dev server doesn't fully support Cloudflare Workers WebSocket API. Disconnection detection and real-time updates only work after deployment to Cloudflare Workers. Current workaround: polling (2s interval) in dev mode.
- _Add other issues as they come up_

### Questions
- _Add questions that need answers_

---

## Quick Reference

**Current Focus:** Phase 3 - Game Logic & State Management (with Phase 2.6 deployment pending for WebSocket testing)

**Completed:**
- ✅ Phase 1: Foundation & Room System (complete)
- ✅ Phase 2: WebSocket Infrastructure (complete)
- 🟡 Phase 3: Game Logic (state machine + box generation done, need answer collection, scoring, game loop)
- 🟡 Phase 5: UI (waiting room done, game view remaining)

**Current Blocker:** Players stuck on "Ready to start! Waiting for game to begin..." - no game start trigger exists yet.

**Recommended Implementation Path** (ordered by dependencies):

### Option A: Minimal Working Game (Fastest to playable)
1. **Phase 3.5a: Game Start Trigger** ⚡ **DO THIS FIRST** (unblocks waiting room)
   - Add "Start Game" button to waiting room UI
   - Create tRPC mutation `game.start` OR handle `ready` message → call `startGame(room)`
   - Immediately call `startRound(room)` → broadcast `roundStart` 
   - **Result:** Game can start, boxes appear (even if answers/scoring not fully working)

2. **Phase 3.3: Answer Collection** (enables player input)
   - Add `roundAnswers` to GameRoom
   - Implement `submitAnswer()` validation
   - Handle `answer` WebSocket messages

3. **Phase 3.4: Scoring System** (enables scoring)
   - Implement `calculateScore()` and `calculateRoundScores()`

4. **Phase 3.5b: Full Game Loop** (complete timing/orchestration)
   - Add all timing logic (visibility duration, answer window, results delay)
   - Round progression with proper state transitions
   - Integration with answer collection and scoring

### Option B: Complete Implementation (Better architecture)
1. **Phase 3.3:** Answer collection (foundation)
2. **Phase 3.4:** Scoring system (foundation)
3. **Phase 3.5:** Full game loop (integrates everything)

**Recommendation:** Start with **Option A (3.5a)** to unblock the waiting room and get basic gameplay working. Then add answer collection and scoring. This gives faster feedback and a working end-to-end flow.

**Key Files Status:**
- ✅ `src/lib/game/types.ts` - Complete (with GameState + RoundState)
- ✅ `src/lib/game/room.ts` - Complete
- ✅ `src/integrations/trpc/routers/game.ts` - Complete
- ✅ `src/routes/game/create.tsx` - Complete
- ✅ `src/routes/game/join.tsx` - Complete
- ✅ `src/routes/game/$roomId.tsx` - Waiting room complete
- ✅ `src/lib/game/gameLogic.ts` - State machine complete
- ✅ `src/lib/websocket/messages.ts` - Complete
- ✅ `src/hooks/useWebSocket.ts` - Complete
- ✅ `src/routes/api/game/ws.$roomId.tsx` - Complete
- ✅ `src/lib/game/boxGenerator.ts` - Complete (pattern-based system)
- ⬜ `src/lib/game/scoring.ts` - **TODO: Create**
- ⬜ `src/lib/game/answerCollection.ts` - **TODO: Create** (or integrate into gameLogic/WebSocket handler)