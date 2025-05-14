import { Context } from 'jsr:@oak/oak'

const wsClients = new Map<string, WebSocket>()

export const addWSClient = (ctx: Context, project: string) => {
  const ws = ctx.upgrade()
  wsClients.set(project, ws)
  return ws
}

export const reloadWSClient = (project: string) => {
  if (!wsClients.has(project)) return

  const ws = wsClients.get(project)!
  if (ws.readyState === ws.OPEN) {
    ws.send('reload')
  }
}
