import { Chalk } from 'npm:chalk'

export const chalk = new Chalk({ level: 3 })
const log = console.log

export const milkaLog = (...message: string[]) => {
  const grayMessages = chalk.gray.apply(chalk, message)
  log.apply(console, [
    `${chalk.bgMagenta.whiteBright.bold(' 🐶 M ')}:`,
    grayMessages,
  ])
}

export const logError = (errorMessage: string) => {
  console.log(chalk.bgBlack.red(`🚨 ${errorMessage}`))
}
