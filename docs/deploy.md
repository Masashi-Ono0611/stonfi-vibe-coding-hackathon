# Deploy Guide

## Infrastructure

| Component | Host | URL |
|-----------|------|-----|
| Telegram Bots (Manager/Hawk/Dove) | fly.io | hawk-dove-bot.fly.dev |
| Web App | Vercel | https://mini-app-rho-bay.vercel.app |

---

## Bot — fly.io

### Deploy

```bash
# Run from project root (not mini-app/)
cd stonfi-vibe-coding-hackathon
~/.fly/bin/fly deploy --app hawk-dove-bot
```

- Dockerfile copies only `src/` (mini-app is excluded)
- Auto-deploy is not configured — manual deploy required after each code change
- Region: nrt (Tokyo)

### Status

```bash
~/.fly/bin/fly status --app hawk-dove-bot
~/.fly/bin/fly logs --app hawk-dove-bot
~/.fly/bin/fly releases --app hawk-dove-bot
```

### Notes

- This bot uses Telegram long-polling (not HTTP), so `[http_service]` is intentionally omitted
- Machine `4d893341f90958` has `autostop=false` — stays running after deploy (verified)
- **If a new machine is created, disable autostop with:**
  ```bash
  ~/.fly/bin/fly machine update <MACHINE_ID> --autostop=false --app hawk-dove-bot --yes
  ~/.fly/bin/fly machine start <MACHINE_ID> --app hawk-dove-bot
  ```
- Environment variables are managed via fly.io Secrets (not `.env`)

---

## Web App — Vercel

### Deploy

```bash
# Run from mini-app/ directory
cd stonfi-vibe-coding-hackathon/mini-app
vercel --prod --scope masashiono0611s-projects --yes
```

- Auto-deploy is not configured — manual deploy required after each code change
- Preview deployments (showing errors) may appear on feature branch pushes — they do not affect production

### Status

```bash
cd mini-app
vercel ls --scope masashiono0611s-projects
```

### Key Files

| File | Purpose |
|------|---------|
| `public/tonconnect-manifest.json` | TON Connect config. `url` and `iconUrl` must point to production URL |
| `components/providers.tsx` | `MANIFEST_URL` = production manifest URL |
| `app/layout.tsx` | OGP metadata and favicon |

---

## Post-Change Checklist

### Bot changes

- [ ] `git push`
- [ ] `~/.fly/bin/fly deploy --app hawk-dove-bot` (from project root)

### Web App changes

- [ ] `git push`
- [ ] `cd mini-app && vercel --prod --scope masashiono0611s-projects --yes`

### Both changed

Run both steps above.

---

## Environment Variables

### Bot (fly.io Secrets)

```
BOT_MANAGER_TOKEN=
BOT_HAWK_TOKEN=
BOT_DOVE_TOKEN=
GROUP_CHAT_ID=
OMNISTON_WS_URL=wss://omni-ws.ston.fi
ANTHROPIC_AUTH_TOKEN=
ANTHROPIC_BASE_URL=
```

### Web App (Vercel Environment Variables)

```
NEXT_PUBLIC_PRIVY_APP_ID=
```
