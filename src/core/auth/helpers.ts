import { ConsoleLogger } from '@nestjs/common';
import type { LogLevel } from 'better-auth';
import { tryGetAppContext } from '../../app.registry';
import { LoggerService } from '../logger/logger.service';

const fallbackLogger = new ConsoleLogger('BetterAuth');

export const betterAuthLogger = (level: LogLevel, message: string, ...args: unknown[]) => {
  const appContext = tryGetAppContext();

  if (!appContext) {
    switch (level) {
      case 'error':
        fallbackLogger.error(message, ...args);
        break;
      case 'warn':
        fallbackLogger.warn(message, ...args);
        break;
      case 'info':
        fallbackLogger.log(message, ...args);
        break;
      case 'debug':
        fallbackLogger.debug(message, ...args);
        break;
    }
    return;
  }

  const logger = appContext.get(LoggerService);

  switch (level) {
    case 'error':
      logger.error(message, ...args, 'BetterAuth');
      break;
    case 'warn':
      logger.warn(message, ...args, 'BetterAuth');
      break;
    case 'info':
      logger.log(message, ...args, 'BetterAuth');
      break;
    case 'debug':
      logger.debug(message, ...args, 'BetterAuth');
      break;
  }
};
