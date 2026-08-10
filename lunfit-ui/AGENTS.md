# lunfit-ui

React Native (Expo SDK 57) client for LunFit. Part of the `lunfit` multi-service
repo alongside `auth-service` and `workout-service` (both Java / Spring Boot).

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Conventions

- **React Native only.** No DOM elements, no `className`, no Tailwind. The
  source design is a React web prototype; every port is a rewrite in RN
  primitives with `StyleSheet.create`.
- **Routing** is file-based via expo-router. Routes live in `app/`, everything
  else in `src/`.
- **Design tokens** live in `src/theme/`, ported from the Figma prototype's
  `theme.css`. Use them — do not hard-code hex values in screens.
- Tailwind alpha suffixes (`bg-primary/10`) become `alpha(colors.primary, 0.1)`.
- **Peer deps**: plain `npm install` works. `react-dom` is pinned to `19.2.3` to
  match `react` — without it npm floats expo-router's transitive `react-dom` to
  the newest 19.x, which peer-requires a newer `react` and hard-fails ERESOLVE.
  Keep `react` and `react-dom` on the same version; add packages with
  `npx expo install` so SDK 57's version map is respected.

## Checks

```
npm run typecheck    # tsc --noEmit
npx expo-doctor      # config + dependency sanity
npx expo export --platform ios   # proves the bundle builds
```
