# Running Nexus for real

Nexus runs in two modes from the same code:

- **Demo**: no backend settings. Sample content, nothing saved. This is what the public GitHub Pages link shows today.
- **Live**: connected to a Supabase project. Real accounts, profiles, posts with photos, follows, Discover, events, RSVPs, private groups and private messages.

## What works live

| Feature | Live |
| --- | --- |
| Create account and sign in (email and password) | Yes |
| Setup: what you make, opt-in switches (all off by default) | Saved to your profile |
| Timeline: you and people you follow, newest first, ends | Yes |
| Posting with a photo | Yes, photos in private storage |
| Profile: header, photo, bio, open to, skills, posts, pinning | Yes, with Edit profile |
| Work modules and work pages | Read from the database (seeded for Nicole) |
| Discover: only opted-in members, Talent match, Mutuals | Yes, mutuals and shared events are real |
| Follow, collaborate requests, saves | Yes |
| Events, free RSVPs, fair drawing entries, event teams | Yes |
| Private groups: invite-only, posts and files for members only | Yes |
| Private messages, with photos and live updates | Yes |
| Paid tickets | Not yet: checkout says payments open soon. See [TICKETING.md](TICKETING.md) |
| Adding work items and events from the app | Not yet: add them in Supabase for now |

## Set up Supabase (about 10 minutes)

1. Create a free account at [supabase.com](https://supabase.com) and a new project. Pick a region near San Diego (West US).
2. In the project, open **SQL Editor** and run these files from this repo, in order:
   1. `supabase/migrations/0001_init.sql`
   2. `supabase/migrations/0002_private.sql`
3. Open **Project Settings → API** and copy the **Project URL** and the **publishable key** (it starts with `sb_publishable_`; older projects call it the `anon` key). The publishable key is meant to be in the app; the security rules protect the data. Never put the `secret` / `service_role` key in the app.
4. Copy `.env.example` to `.env.local` and paste both values in.
5. Run the app (`npm start`), create your account, and finish setup.
6. Back in the SQL Editor, run `supabase/seed.sql` once. It loads your events and work into the first account created, which is yours.

Optional for testing: **Authentication → Providers → Email** has "Confirm email" on by default, so new accounts must click a link before signing in. Leave it on for real launch.

## Put the live app on the web link

In GitHub, open the repo's **Settings → Secrets and variables → Actions → Variables** and add:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The next push rebuilds the site as the live app. Remove them to go back to the demo. If you want both at once, keep this repo as the demo and deploy the live app somewhere else.

After changing `.env.local`, rebuild with `npm run export:web` (it clears the bundler cache, which otherwise keeps the old settings).

## How privacy is enforced

Every table has row level security. The rules were tested against an in-memory Postgres with Supabase's auth and storage stand-ins:

- Signed-out visitors and scrapers can read nothing. Signed-in members can read open posts, profiles and events.
- People can only create or change their own profile, posts, follows, RSVPs and files.
- Discover only lists members who switched it on.
- **Private groups**: only members can see the group, its member list, its posts, or open its files. Only the owner can add people. Removing someone cuts off access immediately. Group posts never appear on the open timeline or profiles.
- **Messages**: only the two people in a conversation can read it, send in it, or open photos sent in it.
- Files are in private storage buckets and load through links that expire after an hour.

## Encryption, honestly

Today everything is **encrypted in transit** (HTTPS) and **at rest** on Supabase's servers, and access is locked down by the rules above. That stops other members, scrapers and AI crawlers.

It is **not end-to-end encrypted** yet: someone with admin access to the database (Nexus, or Supabase) could technically read private posts and messages. True end-to-end encryption means:

1. Each device makes its own key pair (libsodium). Public keys go in the database; private keys never leave the device.
2. Messages and private group posts are encrypted on the sender's device for each recipient, using a shared group key wrapped for every member.
3. Photos are encrypted before upload.
4. Adding a group member re-wraps the group key for them; removing someone rotates it.
5. Key backup with a recovery phrase, so losing a phone doesn't lose your history.

It's worth doing for messages first, then groups. Until then the app says "private" and "members only", not "end-to-end encrypted".
