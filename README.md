# Nexus — app demo

An interactive demo of **Nexus**, a network for creatives built to connect you, not keep you scrolling. Your timeline ends, everything is opt in, and your work is protected from AI.

**Try it in your browser:** https://nicolehernandezcolin-sketch.github.io/nexus-app/

Built with React Native and [Expo](https://expo.dev), so the same code runs on iPhone, Android and the web. Posts, creators and events are sample content.

## What's in the demo

| Screen | What it shows |
| --- | --- |
| Welcome | Pick what you make; every visibility switch starts off |
| Timeline | Newest first from people you follow, and it ends ("You're all caught up") |
| Discover | Search and filter creators who opted in to being found |
| Events | Nexus events and who you follow is going |
| Profile | Work and where you've shown up, with no follower counts or likes |
| Your rules | Privacy, timeline and wellbeing settings, plus always-on AI protection |

## Run it yourself

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm start
```

Then press `w` to open it in a browser, or scan the QR code with the **Expo Go** app on your phone.

## Editing content

All copy, posts, creators and events live in [`src/data/content.ts`](src/data/content.ts). Colors and fonts are in [`src/theme.ts`](src/theme.ts).

## Project layout

```
src/
  app/          one file per screen (Expo Router)
  components/   shared UI: buttons, switches, cards, tab bar, toast
  data/         sample content
  state/        demo state shared across screens
```

## Deploying

Every push to `main` builds the web version and publishes it to GitHub Pages (see `.github/workflows/deploy.yml`). If you rename the repository, update `experiments.baseUrl` in `app.json` to match.
