import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const ENV_FILES = ['.env.local', '.env'];
for (const envFile of ENV_FILES) {
  const fullPath = path.join(projectRoot, envFile);
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath, override: false });
  }
}

export const getEnv = (name, defaultValue = undefined) => {
  if (process.env[name] !== undefined) {
    return process.env[name];
  }
  return defaultValue;
};

export const requireEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

export const isLiveModeEnabled = (flagFromCli = false) => {
  if (flagFromCli) {
    return true;
  }
  const override = getEnv('LEAD_AUTOMATION_LIVE');
  if (override === 'true') {
    return true;
  }
  if (override === 'false') {
    return false;
  }
  return false;
};

export const resolvePathFromRoot = (...parts) => path.join(projectRoot, ...parts);

export default {
  projectRoot,
  dataDir: resolvePathFromRoot('data'),
  leadsDir: resolvePathFromRoot('data', 'leads'),
  logLevel: getEnv('LEAD_AUTOMATION_LOG_LEVEL', 'info')
};
