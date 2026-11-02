import { existsSync } from 'node:fs';

export function loadDotEnv(path = '.env') {
  if (existsSync(path)) process.loadEnvFile(path); // built into Node >= 20.12
}

const int = (x, d) => (Number.isFinite(parseInt(x, 10)) ? parseInt(x, 10) : d);

export function loadConfig(env = process.env, overrides = {}) {
  const production = env.NODE_ENV === 'production';
  const config = {
    production,
    host: env.HOST || (env.RENDER ? '0.0.0.0' : '127.0.0.1'), // Render sets RENDER=true and can only reach 0.0.0.0
    port: int(env.PORT, 3000),
    trustProxy: env.TRUST_PROXY === 'true',
    allowedOrigins: (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    storage: {
      driver: env.STORAGE_DRIVER || 'sqlite', sqlitePath: env.SQLITE_PATH || './data/jupiter.db',
      github: { // only used when STORAGE_DRIVER=github
        token: env.GITHUB_TOKEN || '', repo: env.GITHUB_REPO || '', branch: env.GITHUB_BRANCH || 'jupiter-data',
        path: env.GITHUB_DATA_PATH || 'jupiter-data.json', flushMs: int(env.GITHUB_FLUSH_MS, 3000),
        serverless: env.VERCEL === '1' || env.GITHUB_SERVERLESS === 'true',
        ephemeral: (env.GITHUB_EPHEMERAL_COLLECTIONS || '').split(',').map((s) => s.trim()).filter(Boolean),
      },
    },
    // Jupiter (apps/jupiter): music binaries and listening history live in a SEPARATE branch (never the data branch).
    jupiter: { driver: env.JUPITER_MEDIA_DRIVER || '', repo: env.JUPITER_MEDIA_REPO || '', branch: env.JUPITER_MEDIA_BRANCH || 'jupiter-media', token: env.JUPITER_MEDIA_TOKEN || '',
      dir: env.JUPITER_MEDIA_DIR || './data/jupiter-media', secret: env.JUPITER_SECRET || '', cronSecret: env.CRON_SECRET || '',
      maxFileMb: int(env.JUPITER_MAX_FILE_MB, 200), libraryLimitMb: int(env.JUPITER_LIBRARY_LIMIT_MB, 900) },
    cloudinary: { cloudName: env.CLOUDINARY_CLOUD_NAME || '', uploadPreset: env.CLOUDINARY_UPLOAD_PRESET || '' },
    session: { ttlHours: int(env.SESSION_TTL_HOURS, 168) },
    // Public sign-up: anyone can create an account; new accounts get the "member" role (their own private music library).
    signup: { enabled: env.SIGNUP_ENABLED !== 'false', roleId: env.SIGNUP_ROLE || 'member' },
    bootstrap: { email: env.BOOTSTRAP_ADMIN_EMAIL || '', password: env.BOOTSTRAP_ADMIN_PASSWORD || '' },
    rateLimits: {
      global: { windowMs: 60_000, max: 300 },
      loginIp: { windowMs: 15 * 60_000, max: 30 },
      loginEmail: { windowMs: 15 * 60_000, max: 5 }, // failed attempts per email
      signup: { windowMs: 60 * 60_000, max: 10 }, // new accounts per IP per hour
    },
  };
  return { ...config, ...overrides, rateLimits: { ...config.rateLimits, ...(overrides.rateLimits || {}) } };
}
