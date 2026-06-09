

import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });


function requireEnv(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (!val) {
    console.warn(`[Config] WARNING: Environment variable "${key}" is not set.`);
    return '';
  }
  return val;
}

export const AppConfig = {
  PORT: parseInt(process.env['PORT'] ?? '3000', 10),
  NODE_ENV: process.env['NODE_ENV'] ?? 'development',
  isDev: (process.env['NODE_ENV'] ?? 'development') === 'development',
} as const;

// ── JWT Config ────────────────────────────────
export const JwtConfig = {
  SECRET: requireEnv('JWT_SECRET', '3543454rbfwerbfsdfewrwerwerf'),
  EXPIRES_IN: process.env['JWT_EXPIRES_IN'] ?? '7d',
} as const;

// ── AI Config ─────────────────────────────────
export type AIProvider = 'openai' | 'google';

export const AIConfig = {
  PROVIDER: (process.env['AI_PROVIDER'] ?? 'openai') as AIProvider,
  OPENAI_API_KEY: process.env['OPENAI_API_KEY'] ?? 'OPENAI_KEY_PLACEHOLDER',
  OPENAI_MODEL: process.env['OPENAI_MODEL'] ?? 'gpt-4o',
  GOOGLE_API_KEY: process.env['GOOGLE_GENAI_API_KEY'] ?? 'GOOGLE_KEY_PLACEHOLDER',
  GOOGLE_MODEL: process.env['GOOGLE_MODEL'] ?? 'gemini-1.5-flash',
} as const;

export function maskKey(key: string) {
  if (!key || key.includes('PLACEHOLDER')) return ' Not Set or Placeholder';
  if (key.length < 10) return ' Key too short (Invalid)';
  return ` Loaded (${key.substring(0, 6)}...${key.substring(key.length - 4)})`;
}



// ── Lazy OpenAI Client ─────────────────────────
let _openaiClient: import('openai').default | null = null;

export function getOpenAIClient(): import('openai').default {
  if (!_openaiClient) {
    console.log(`[Config] Initializing OpenAI Client...`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const OpenAI = require('openai').default as typeof import('openai').default;
    _openaiClient = new OpenAI({ apiKey: AIConfig.OPENAI_API_KEY });
  }
  return _openaiClient;
}

// ── Lazy Google GenAI Client ───────────────────
let _googleClient: import('@google/genai').GoogleGenAI | null = null;

export function getGoogleClient(): import('@google/genai').GoogleGenAI {
  if (!_googleClient) {
    console.log(`[Config] Initializing Google GenAI Client...`);
 
    const { GoogleGenAI } = require('@google/genai') as typeof import('@google/genai');
    _googleClient = new GoogleGenAI({ apiKey: AIConfig.GOOGLE_API_KEY });
  }
  return _googleClient;
}