# Deploy Guide

## 構成

| コンポーネント | ホスト | URL |
|-------------|--------|-----|
| Telegram Bots (Manager/Hawk/Dove) | fly.io | hawk-dove-bot.fly.dev |
| Mini App | Vercel | https://mini-app-rho-bay.vercel.app |

---

## Bot — fly.io

### デプロイ手順

```bash
# プロジェクトルートから実行（mini-app/ ではない）
cd stonfi-vibe-coding-hackathon
~/.fly/bin/fly deploy --app hawk-dove-bot
```

- Dockerfile は `src/` のみコピー（mini-app は含まない）
- 自動デプロイは未設定 → コード変更後は手動 deploy 必須
- リージョン: nrt（東京）

### ステータス確認

```bash
~/.fly/bin/fly status --app hawk-dove-bot
~/.fly/bin/fly logs --app hawk-dove-bot
~/.fly/bin/fly releases --app hawk-dove-bot
```

### 注意事項

- `auto_stop_machines = 'stop'` のため、未使用時はマシンが停止する
- Telegram からのイベント受信時に自動再起動するため通常運用は問題なし
- 環境変数は fly.io の Secrets で管理（`.env` は使わない）

---

## Mini App — Vercel

### デプロイ手順

```bash
# mini-app/ ディレクトリから実行
cd stonfi-vibe-coding-hackathon/mini-app
vercel --prod --scope masashiono0611s-projects --yes
```

- 自動デプロイは未設定 → コード変更後は手動 deploy 必須
  - Vercel の Root Directory を `mini-app` に設定すれば自動化可能（未対応）
- Preview デプロイ（Error 表示）は feature ブランチへの push で発生するが本番に影響なし

### ステータス確認

```bash
cd mini-app
vercel ls --scope masashiono0611s-projects
```

### 重要ファイル

| ファイル | 用途 |
|---------|------|
| `public/tonconnect-manifest.json` | TON Connect 設定。`url` と `iconUrl` は本番 URL |
| `components/providers.tsx` | `MANIFEST_URL` = 本番 manifest URL |
| `app/layout.tsx` | OGP メタデータ |

---

## 変更後の作業チェックリスト

### Bot コード変更時

- [ ] `git push`
- [ ] `~/.fly/bin/fly deploy --app hawk-dove-bot`（プロジェクトルートから）

### Mini App 変更時

- [ ] `git push`
- [ ] `cd mini-app && vercel --prod --scope masashiono0611s-projects --yes`

### 両方変更時

上記を両方実施する。

---

## 環境変数

### Bot（fly.io Secrets）

```
BOT_MANAGER_TOKEN=
BOT_HAWK_TOKEN=
BOT_DOVE_TOKEN=
GROUP_CHAT_ID=
OMNISTON_WS_URL=wss://omni-ws.ston.fi
ANTHROPIC_AUTH_TOKEN=
ANTHROPIC_BASE_URL=
```

### Mini App（Vercel Environment Variables）

```
NEXT_PUBLIC_PRIVY_APP_ID=
```
