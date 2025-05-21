import { Chalk } from 'npm:chalk'

export const chalk = new Chalk({ level: 3 })
const log = console.log

export const milkaLog = (...message: string[]) => {
  const grayMessages = chalk.gray.visible.apply(chalk, message)
  log.apply(console, [
    `${chalk.bgMagenta.whiteBright.visible.bold('~🐶 M~')}:`,
    grayMessages,
  ])
}

export const logError = (errorMessage: string) => {
  log(chalk.bgBlack.red(`🚨 ${errorMessage}`))
}
