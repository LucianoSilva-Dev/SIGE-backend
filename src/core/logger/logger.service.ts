import { ConsoleLogger, Injectable } from '@nestjs/common';
import pino, { type Logger as PinoLogger } from 'pino';

@Injectable()
export class LoggerService extends ConsoleLogger {
  private readonly pinoLogger: PinoLogger;

  constructor() {
    super();
    this.pinoLogger = pino({
      base: {
        service_name: 'sige-backend',
      },
      messageKey: 'msg',
      timestamp: pino.stdTimeFunctions.isoTime,
    });
  }

  override error(message: unknown, ...optionalParams: unknown[]) {
    super.error(message, ...optionalParams);
    this.pinoLogger.error({ context: optionalParams[0] }, String(message));
  }

  override fatal(message: unknown, ...optionalParams: unknown[]) {
    super.fatal(message, ...optionalParams);
    this.pinoLogger.fatal({ context: optionalParams[0] }, String(message));
  }

  override warn(message: unknown, ...optionalParams: unknown[]) {
    super.warn(message, ...optionalParams);
    this.pinoLogger.warn({ context: optionalParams[0] }, String(message));
  }

  override log(message: unknown, ...optionalParams: unknown[]) {
    super.log(message, ...optionalParams);
    this.pinoLogger.info({ context: optionalParams[0] }, String(message));
  }

  override debug(message: unknown, ...optionalParams: unknown[]) {
    super.debug(message, ...optionalParams);
    this.pinoLogger.debug({ context: optionalParams[0] }, String(message));
  }

  override verbose(message: unknown, ...optionalParams: unknown[]) {
    super.verbose(message, ...optionalParams);
    this.pinoLogger.trace({ context: optionalParams[0] }, String(message));
  }
}
