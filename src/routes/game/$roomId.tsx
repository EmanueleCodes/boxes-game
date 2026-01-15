import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/game/$roomId')({
  component: RouteComponent,
})

function RouteComponent() {


    const {roomId} = Route.useParams()

  return <div>Hello "/game/$roomId" {roomId}!</div>
}
