# AI Prompt: Implement Game Start Trigger for Multiplayer Counting Game

## Project Context

I'm building a real-time multiplayer counting game using **TanStack Start**, **tRPC**, **WebSockets**, and **TypeScript**. Players join rooms, count 3D boxes that appear briefly, submit answers, and compete on accuracy.

## Current State

**✅ Completed:**
- Room creation/joining system (tRPC endpoints)
- WebSocket infrastructure (message protocol, connection management)
- Game state machine (`GameState`: 'notStarted' | 'started' | 'finished', `RoundState`: 'notStarted' | 'showingBoxes' | 'answering' | 'showResults')
- Box generation system (pattern-based with `BoxGroup` containing boxes + animation metadata)
- Waiting room UI (shows players, room ID, "Ready to start!" message)

**❌ Current Blocker:**
Players are stuck on the "Ready to start! Waiting for game to begin..." screen. There's no trigger to actually start the game when 2+ players are in the room.

## Technical Details

**File Structure:**
- `src/lib/game/gameLogic.ts` - Contains `startGame(room)` and `startRound(room)` functions ready to use
- `src/lib/game/types.ts` - `GameRoom` interface with `gameState`, `roundState`, `roundData`
- `src/lib/game/boxGenerator.ts` - `generateBoxGroup(round)` returns `BoxGroup` with boxes and animation
- `src/integrations/trpc/routers/game.ts` - tRPC router with `create`, `join`, `status` procedures
- `src/routes/api/game/ws.$roomId.tsx` - WebSocket handler (has `ready` message case but doesn't do anything)
- `src/routes/game/$roomId.tsx` - Waiting room UI component
- `src/lib/websocket/messages.ts` - Message types including `ReadyMessage`, `GameStartingMessage`, `RoundStartMessage`

**Key Functions Available:**
```typescript
// In gameLogic.ts
startGame(room: GameRoom): void  // Transitions gameState to 'started', initializes round 1
startRound(room: GameRoom): void  // Generates boxes, sets roundState to 'showingBoxes'
```

**WebSocket Messages:**
- Client → Server: `ready` (currently received but not processed)
- Server → Client: `gameStarting`, `roundStart` (types defined but not sent yet)

## What Needs to Be Implemented

### Option 1: "Start Game" Button (Recommended for MVP)

1. **Add tRPC mutation** (`src/integrations/trpc/routers/game.ts`):
   - Add `start` mutation that:
     - Validates room exists and has 2+ players
     - Validates gameState is 'notStarted'
     - Calls `startGame(room)` from `gameLogic.ts`
     - Immediately calls `startRound(room)` to generate boxes
     - Broadcasts `gameStarting` message via WebSocket to all players
     - Broadcasts `roundStart` message with boxes data
     - Returns success

2. **Add button to waiting room UI** (`src/routes/game/$roomId.tsx`):
   - Show "Start Game" button when `room.gameState === 'notStarted' && room.players.length >= 2`
   - Button only visible to room creator (first player) OR to all players
   - Call tRPC `game.start.mutate({ roomId })` on click
   - Handle loading/error states

### Option 2: Auto-start After Delay

If you prefer auto-start (simpler UX but less control):
- When 2+ players join and gameState is 'notStarted'
- Set a 3-second timer
- Automatically call `startGame()` → `startRound()` → broadcast messages

### Option 3: WebSocket `ready` Message Handler

- In `ws.$roomId.tsx`, enhance the `ready` message handler
- When all players have sent `ready` → start game automatically

## Requirements

1. **Validation:**
   - Check `canStartGame(room)` before starting (from `gameLogic.ts`)
   - Ensure gameState is 'notStarted'
   - Ensure 2+ players

2. **State Transitions:**
   - Call `startGame(room)` → sets `gameState: 'started'`, `currentRound: 1`, `roundState: 'notStarted'`
   - Call `startRound(room)` → generates boxes via `generateBoxGroup()`, sets `roundState: 'showingBoxes'`

3. **WebSocket Broadcasting:**
   - After `startGame()` → broadcast `gameStarting` message to all WebSocket connections in room
   - After `startRound()` → broadcast `roundStart` message with `{ round, boxes }` from `room.roundData`

4. **Error Handling:**
   - Handle cases: room not found, game already started, not enough players
   - Return appropriate tRPC errors or WebSocket error messages

## Implementation Notes

- Use `roomManager.getRoom(roomId)` to get room instance
- Use `room.websocketConnections` Map to broadcast messages (see existing `broadcastToRoom` patterns in `ws.$roomId.tsx`)
- `room.roundData.boxes` contains the Box[] after `startRound()` is called
- Import `startGame` and `startRound` from `@/lib/game/gameLogic`
- Import message creation helpers from `@/lib/websocket/messages` (e.g., `createGameStartingMessage`, `createRoundStartMessage`)

## Expected Outcome

After implementation:
- Players in waiting room see "Start Game" button (or game auto-starts)
- Clicking starts the game → `gameState` changes to 'started'
- First round begins → boxes are generated and `roundStart` message is broadcast
- Waiting room UI updates to show game has started (you can check `room.gameState === 'started'` in the UI)

## Future Steps (Not Needed Now)

- Answer collection (Phase 3.3) - will be next
- Scoring system (Phase 3.4)
- Full game loop with timing (Phase 3.5b) - rounds will progress manually for now

## Questions to Consider

- Should only the room creator be able to start, or any player when 2+ are ready?
- Should there be a countdown before starting?
- Should we validate that all players are still connected before starting?

Please implement Option 1 (tRPC mutation + UI button) and make sure to handle all edge cases and broadcast the appropriate WebSocket messages.
