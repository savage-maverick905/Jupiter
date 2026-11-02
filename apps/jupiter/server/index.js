// Jupiter: the music library and player. Loaded by core/appLoader.js, which calls register().
// Routes live under /api/apps/jupiter/ and answer 404 until Jupiter is installed (done automatically at startup).
import { makeLibrary } from './library.js';
import { createMediaStore } from './media.js';
import { makeUploads } from './upload.js';
import { makeAnalytics } from './analytics.js';
import { makeMaintenance } from './maintenance.js';
import { routes } from './routes.js';

export function register({ router, services: s }) {
  const media = s.jupiterMedia || createMediaStore(s.config, { log: s.log });
  const lib = makeLibrary(s, media), uploads = makeUploads(s, media, lib), analytics = makeAnalytics(s, media, lib), maintenance = makeMaintenance(s, media, lib);
  routes({ router, s, lib, media, uploads, analytics, maintenance });
}
