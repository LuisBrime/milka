import { isHttpError, type Middleware, Status } from 'jsr:@oak/oak';
import {
  type ApplicationErrorEvent,
  type State,
} from 'jsr:@oak/oak/application';
import { logError } from '@/log';

interface ErrorHandler {
  middleware: Middleware;
  listener<S extends AS, AS extends State>(
    error: ApplicationErrorEvent<S, AS>,
  ): void;
}

export const errorHandler: ErrorHandler = {
  async middleware(ctx, next) {
    try {
      await next();
    } catch (error) {
      if (isHttpError(error)) {
        switch (error.status) {
          case Status.NotFound:
            logError(
              '😩 could not render project, please check given name and try again',
            );
            break;

          case Status.NotAcceptable:
            logError('😳 failed to build project');
            break;

          default:
            break;
        }
        ctx.response.with(error.asResponse({ prefer: 'html' }));
      } else {
        throw error;
      }
    }
  },
  listener(event) {
    logError(`😳 milka caught an error: ${event.error.message ?? '😩?'}`);
    if (event.context) {
      event.context.response.status = 500;
    }
  },
};
