import pino from 'pino';
import pinoPretty from 'pino-pretty';
import settings from '../config/settings.js';

const pretty = pinoPretty({
  colorize: true,
  translateTime: 'SYS:standard',
  ignore: 'pid,hostname'
});

const logger = pino(
  {
    level: settings.logLevel || 'info',
    base: undefined
  },
  pretty
);

export default logger;
