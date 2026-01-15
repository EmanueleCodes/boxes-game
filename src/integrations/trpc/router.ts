

import { createTRPCRouter} from './init'


import { gameRouter } from './routers/game'



export const trpcRouter = createTRPCRouter({
	game: gameRouter,
})
export type TRPCRouter = typeof trpcRouter
