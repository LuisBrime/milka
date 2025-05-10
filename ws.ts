import { Context } from 'jsr:@oak/oak'
import { HtmlRspackPlugin, type RspackPluginInstance } from 'npm:@rspack/core'

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

const wsReloadScript = `
  <!-- script injected by milka -->
  <script>
    const ws = new WebSocket(location.href.replace('http', 'ws'))
    ws.onmessage = (e) => {
      const action = e.data
      if (action === 'woof') {
        console.log('🐶 woof!')
      } else if (action === 'reload') {
        location.reload()
      }
    }
  </script>
`

export const WSScriptPlugin: RspackPluginInstance = {
  apply(compiler) {
    compiler.hooks.compilation.tap('WSScriptPlugin', (compilation) => {
      HtmlRspackPlugin.getCompilationHooks(compilation).beforeEmit.tap(
        'WSScriptPlugin',
        (data) => {
          data.html = data.html.replace('</body>', `${wsReloadScript}</body>`)
          return data
        },
      )
    })
  },
}
