import os from 'os';
import winston from 'winston';

export function getHostInfo() {
  return {
    desktopName: os.hostname(),
    os: os.platform()
  };
}

export function nowIso() {
  return new Date().toISOString();
}

// Winston logger instance
const coreLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'agent.log' }),
    new winston.transports.Console()
  ]
});

// Wrapper functions (optional, clearer API)
export function logInfo(message) {
  coreLogger.info(message);
}

export function logError(message) {
  coreLogger.error(message);
}

export default coreLogger; // in case you want direct access
