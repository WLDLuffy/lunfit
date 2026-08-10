# lunfit-ui

React Native client for LunFit, built with Expo SDK 57 and expo-router.

Ported from the Figma Make prototype
[Running app with AI coach](https://www.figma.com/make/v4R7sausOzNh7DKo1mfCsv/Running-app-with-AI-coach).
That prototype is React **web** (Tailwind + shadcn/ui + recharts); everything
here is a rewrite in React Native primitives.

## Running it

```bash
npm install
npm start          # then press i / a, or scan the QR code with Expo Go
```

Location and maps on the Track screen need a development build rather than
Expo Go:

```bash
npx expo run:ios     # or run:android
```

## Layout

```
app/                     expo-router routes
├── _layout.tsx          fonts, splash, auth gate
├── login.tsx            sign in / sign up
├── profile.tsx          modal
└── (tabs)/              Dashboard · Run Log · Track · AI Coach · Goals
src/
├── theme/               colours, type scale, spacing — ported from theme.css
├── components/          Screen, Card, Pending
├── data/                fixtures + types from the prototype
├── api/                 fetch client, service base URLs
└── lib/                 auth context, token storage
```

## Backend

Talks to the sibling services in this repo. Both are optional — with no env
vars set, the app runs entirely on the fixtures in `src/data/mock.ts` and login
accepts anything.

| Service | Default | Env var |
| --- | --- | --- |
| auth-service | `http://localhost:8080` | `EXPO_PUBLIC_AUTH_URL` |
| workout-service | `http://localhost:8081` | `EXPO_PUBLIC_WORKOUT_URL` |

Copy `.env.example` to `.env.local` to point at real services. Access tokens are
held in memory only; refresh tokens go to SecureStore — see `src/lib/session.ts`.

## Status

The navigation shell, theme, login and profile are built. The five tab screens
are scaffolded with a `<Pending>` card listing what each still needs from the
prototype. Charts have no library chosen yet — the prototype uses recharts,
which is web-only.

## Checks

```bash
npm run typecheck
npx expo-doctor
```
