# Darsy — N8N Automation Workflows

Location: [darsy-marketing/n8n/workflows/](../darsy-marketing/n8n/workflows/)
Instance: Local Docker, `http://localhost:5678` (container named `n8n`)
Setup guide: [darsy-marketing/n8n/docs/credentials-setup-guide.md](../darsy-marketing/n8n/docs/credentials-setup-guide.md)

## Running N8N

```bash
# Start ngrok (public tunnel required since N8N 2.14+)
ngrok http 5678

# Start n8n container with the ngrok URL as WEBHOOK_URL
docker rm -f n8n
docker run -d --name n8n -p 5678:5678 \
  -e WEBHOOK_URL=https://NEW_NGROK_URL/ \
  -v n8n_data:/home/node/.n8n \
  docker.n8n.io/n8nio/n8n
```

Notes:
- N8N 2.14 removed the built-in `N8N_TUNNEL=true`. Use ngrok.
- Activate a workflow with the **Publish** button (top right). No toggle switch in this version.
- All workflows below ship with webhook triggers patched in (`add-webhook-triggers.js`).

## MongoDB access inside Docker

N8N must call MongoDB with host `host.docker.internal`, not `localhost`.

---

## Required Credentials

| N8N Credential   | Type                      | Used by (partial) |
|------------------|---------------------------|-------------------|
| OpenAI           | OpenAI API                | Most AI workflows |
| Telegram         | Telegram API              | Approval handlers, support bot, command center |
| Google Drive     | Google Drive OAuth2       | Asset storage |
| Google Sheets    | Google Sheets OAuth2      | Content calendar, metrics logs |
| MongoDB          | MongoDB                   | User segmentation, analytics |
| SendGrid (SMTP)  | SMTP                      | Newsletters, drip sequences |
| Facebook/IG      | Environment variables     | Social autopilot |
| SerpAPI          | Environment variable      | SEO + competitor monitoring |

## Environment Variables

```
FB_PAGE_ID
FB_PAGE_ACCESS_TOKEN
IG_BUSINESS_ACCOUNT_ID
SERPAPI_KEY
WHATSAPP_PHONE_ID
WHATSAPP_TOKEN
N8N_WEBHOOK_URL=http://localhost:5678
CONTENT_SHEET_ID
```

---

## Marketing (12)

| File | Purpose | Triggers / Schedule |
|------|---------|---------------------|
| `morocco-trends-poster.json` | Fetch Morocco trends → AI poster → Telegram approval | Cron daily + manual |
| `morocco-trends-approval-handler.json` | Handle Telegram approve/reject/regenerate | Telegram webhook |
| `content-repurposing-engine.json` | Convert articles into all social formats | Webhook on publish |
| `seo-keyword-monitor.json` | Track education-keyword rankings | Daily cron |
| `competitor-spy.json` | Monitor competitor content/features | Daily cron |
| `ai-content-calendar.json` | AI-generate weekly content plan | Weekly cron |
| `social-media-autopilot.json` | Auto-post from Google Sheets calendar | Hourly cron |
| `social-listening-engagement.json` | Monitor mentions, sentiment, auto-reply | Cron + webhook |
| `ugc-collector.json` | Find + repost user-generated content | Daily cron |
| `viral-hook-generator.json` | Daily AI viral content ideas + visuals | Daily cron |
| `influencer-outreach.json` | Find & contact education influencers | Weekly cron |
| `ai-social-media-manager.json` | Full AI agent managing socials | Cron + webhook |

## Engagement (6)

| File | Purpose |
|------|---------|
| `welcome-drip-sequence.json` | 5-email onboarding with smart branching |
| `reengagement-campaign.json` | Win-back at 7/14/30/60 day inactivity |
| `smart-newsletter.json` | AI-curated weekly newsletter (AR + FR) |
| `subscription-upgrade-nudge.json` | Personalized upsell for free users |
| `milestone-celebrations.json` | Celebrate streaks, completions, badges |
| `ai-support-chatbot.json` | Telegram bot with AI customer support |

## Analytics (3)

| File | Purpose |
|------|---------|
| `weekly-growth-dashboard.json` | Full weekly report with AI insights → email |
| `churn-predictor.json` | AI identifies at-risk users daily |
| `ab-test-content.json` | Generate and track A/B content tests |

## Growth (3)

| File | Purpose |
|------|---------|
| `referral-program.json` | Automated referral tracking + rewards |
| `viral-loop-engine.json` | Share achievements with pre-filled links |
| `lead-magnet-funnel.json` | Lead capture → nurture → convert |

## Advanced / Integrations (4)

| File | Purpose |
|------|---------|
| `personalized-recommendations.json` | AI lesson recommendations per user |
| `review-reputation-manager.json` | Monitor + respond to reviews/mentions |
| `seasonal-campaign-engine.json` | Auto-launch seasonal campaigns |
| `whatsapp-community-bot.json` | AI-powered WhatsApp support |

---

## Notes

- Workflow design uses: Trigger → Fetch → AI node (OpenAI) → Decision → Action (post, email, DB update, Telegram).
- Every AI-generated piece flows through a Telegram approval step before going live (configurable).
- Rate limit respected: posting nodes serialize with delays.
- All MongoDB reads/writes go through `host.docker.internal:27017` from inside the n8n container.

## Command Center

- Custom workflow wired to Telegram bot `darsyschoolbot`.
- Used as a one-chat control surface to trigger any of the 27 workflows on demand.
- Token regeneration required on release (bot token was exposed in previous sessions).
