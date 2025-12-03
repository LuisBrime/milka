import { Context } from '@oak/oak';

const wsClients = new Map<string, WebSocket>();

export const addWSClient = (ctx: Context, sketch: string) => {
  const ws = ctx.upgrade();
  wsClients.set(sketch, ws);
  return ws;
};

export const reloadWSClient = (sketch: string) => {
  if (!wsClients.has(sketch)) return;

  const ws = wsClients.get(sketch)!;
  if (ws.readyState === ws.OPEN) {
    ws.send('reload');
  }
};
