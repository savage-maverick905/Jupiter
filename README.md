# Jupiter

Your own private music locker: upload the music you own, build playlists, download tracks for offline and see your listening stats. Built by Hie.

## Run the server
```bash
cp .env.example .env     # set BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD (10+ chars) and KEY_ENCRYPTION_SECRET
npm start                # http://localhost:3000
```
Music is stored in `JUPITER_MEDIA_DIR` (default `./data/jupiter-media`) or in a private GitHub branch (see `.env.example`).
Deploy with `vercel.json` (static + API) or any Node host with `npm start`.

## Android app (APK)
The screens are bundled inside the APK (they open instantly and work offline); your account, library and music load from your deployed server. With no connection the app shows a "No connection" screen.

1. Push this repo to GitHub.
2. Repo > Settings > Secrets and variables > Actions > **Variables** > `JUPITER_URL` = `https://your-site.vercel.app` (https, no trailing slash).
3. Actions > **Build Jupiter APK** > Run workflow. Download the `jupiter-apk` artifact and install the APK.

Local build: `cd android && gradle assembleDebug -PjupiterUrl=https://your-site.vercel.app` (Gradle 8.9, JDK 17, Android SDK 34).
The APK is signed with the committed `android/debug.keystore` (fine for your own phone; make a private key before publishing to Play Store).

## Layout
- `apps/jupiter/` the app (frontend + `server/` backend), including `privacy.html`
- `android/` the native Android shell
- `http/ auth/ database/ config/ core/ shared/` the host: accounts, sessions, storage, router
- `tests/` run with `npm test`
