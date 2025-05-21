import { Application } from 'jsr:@oak/oak'

import { getMilkaCompiler } from '@/compiler'
import { chalk, milkaLog } from '@/log'
import { sketchRouter } from '@/router'
import { errorHandler } from '@/router/middleware'

const SERVER_PORT = parseInt(Deno.env.get('PORT') ?? '8000')

console.log('\n')
console.log(
  chalk.underline(
    `🐶 welcome to ${chalk.hex('#ec4899').bold('milka')},`,
    'your creative coding companion!\n',
  ),
)

const app = new Application()
app.use(sketchRouter.routes())
app.use(sketchRouter.allowedMethods())

app.addEventListener('listen', ({ port }) => {
  console.group()
  milkaLog(`will run on port: ${chalk.italic.bold(`${port}`)}`)
  milkaLog('listening...\n')
  console.groupEnd()
})
app.addEventListener('error', errorHandler.listener)

const closingController = new AbortController()
const signalHandler = async (): Promise<void> => {
  Deno.removeSignalListener('SIGINT', signalHandler)
  console.log('\n')
  milkaLog(chalk.underline('🤍 closing server, bye bye! 👋'))
  console.log('\n')

  const milkaCompiler = await getMilkaCompiler()
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
