# Nexus — app demo

An interactive demo of **Nexus**, a network for creatives built to connect you, not keep you scrolling. Your timeline ends, everything is opt in, and your work is protected from AI.

**Try it in your browser:** https://nicolehernandezcolin-sketch.github.io/nexus-app/

Built with React Native and [Expo](https://expo.dev), so the same code runs on iPhone, Android and the web. Posts, creators and events are sample content.

## What's in the demo

| Screen | What it shows |
| --- | --- |
| Welcome | Pick what you make; every visibility switch starts off |
| Timeline | Newest first from people you follow, and it ends ("You're all caught up"). Post new work, a "Looking for" or a crew call, with a photo |
| Discover | Search and filter creators who opted in to being found, use Talent match to rank them by what your project needs, or show only Mutuals: people you share a past event or connection with |
| Events | Nexus events, ticket sales with a lower fee than Eventbrite, free RSVPs and fair drawings |
| Event page and checkout | Ticket tiers, a 4-per-person limit, a fee breakdown and a fair-access check before paying |
| My tickets | Named tickets with a live code that changes every 15 seconds, free transfers and face-value resale |
| Profile | A customizable header (cover color, photo or upload, and pattern), real bio and photo, upcoming events with tickets, and work organized into modules you can reorder, hide and collapse, plus a Posts tab with pinning. No follower counts or likes |
| Team profiles | Everyone who worked on an event, linked from My events, with what they did |
| Work pages | Every piece on the profile opens with details, credits, linked events and related posts |
| Your rules | Privacy, timeline and wellbeing settings, plus always-on AI protection |

## Run it yourself

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
npm install
npm start
```

Then press `w` to open it in a browser, or scan the QR code with the **Expo Go** app on your phone.

## Ticketing

The fee, the per-person limit and the code refresh time live in [`src/data/fees.ts`](src/data/fees.ts). How real payments and anti-scalping protections would work is written up in [`docs/TICKETING.md`](docs/TICKETING.md). Ticket prices in the demo are samples and nothing is charged.

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
