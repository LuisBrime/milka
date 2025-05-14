import { Application } from 'jsr:@oak/oak'
import { Status } from 'jsr:@oak/commons/status'
import { isHttpError } from 'jsr:@oak/commons/http_errors'

import { milkaCompiler } from '@/compiler/index.ts'
import { chalk, logError, milkaLog } from '@/log'
import { projectRouter } from '@/routes'

const SERVER_PORT = parseInt(Deno.env.get('PORT') ?? '8000')

console.log('\n')
console.log(
  chalk.underline(
    `🐶 welcome to ${chalk.hex('#ec4899').bold('milka')},`,
    'your creative coding companion!\n',
  ),
)

const app = new Application()
app.use(async (ctx, next) => {
  const isWs = ctx.request.headers.get('upgrade') === 'websocket'
  const path = new URL(ctx.request.url).pathname

  console.group(
    `${chalk.gray.bold(ctx.request.method)}${
      isWs ? ' websocket' : ''
    } request ${chalk.green.italic(path)}`,
  )

  try {
    await next()
  } catch (error) {
    if (isHttpError(error)) {
      switch (error.status) {
        case Status.NotFound:
          logError(
            `😩 could not render project, please check name and try again`,
          )
          break

        case Status.NotAcceptable:
          logError(
            `😳 failed to build project`,
          )
          break

        default:
          break
      }
      ctx.response.with(error.asResponse({ prefer: 'html' }))
    } else {
      throw error
    }
  } finally {
    console.groupEnd()
  }
})

app.use(projectRouter.routes())
app.use(projectRouter.allowedMethods())

app.addEventListener('listen', ({ port }) => {
  console.group()
  milkaLog(`will run on port: ${chalk.italic.bold(`${port}`)}`)
  milkaLog('listening...\n')
  console.groupEnd()
})

const closingController = new AbortController()
const signalHandler = async (): Promise<void> => {
  Deno.removeSignalListener('SIGINT', signalHandler)
  console.log('\n')
  milkaLog(chalk.underline('🤍 closing server, bye bye! 👋'))
  console.log('\n')

  await milkaCompiler.closeAll()
  closingController.abort()
  Deno.exit(0)
}

Deno.addSignalListener('SIGINT', signalHandler)

await app.listen({
  port: SERVER_PORT,
  secure: false,
  signal: closingController.signal,
})
