# Telegram Bot Command Center - Architecture

## How It Works

```
YOU (Telegram)
     │
     │  /menu or /start
     ▼
┌─────────────────────────────────┐
│   🤖 Udarsy Bot Command Center   │
│   (telegram-command-center.json)│
└─────────────────────────────────┘
     │
     │  Shows inline keyboard menus
     ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│📣Marketing│  │💌Engagmnt│  │📊Analytics│  │🚀 Growth │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
     │               │              │             │
     │  You tap a button            │             │
     ▼                              │             │
"⏳ Starting..."                    │             │
     │                              │             │
     │  POST to workflow webhook    │             │
     ▼                              │             │
┌─────────────────────────────────────────────────────┐
│            Individual Workflow Runs                  │
│  (morocco-trends, newsletter, churn, etc.)           │
└─────────────────────────────────────────────────────┘
     │
     │  Results sent back to YOUR Telegram chat
     ▼
"✅ Here are today's trends poster..."
[Approve] [Reject] [Regenerate]
```

---

## Bot Commands (type these in Telegram)

| Command | Opens |
|---------|-------|
| `/start` or `/menu` | Main menu with all categories |
| `/marketing` | Marketing workflows submenu |
| `/engagement` | Engagement workflows submenu |
| `/analytics` | Analytics workflows submenu |
| `/growth` | Growth workflows submenu |
| `/status` | Live platform stats from Udarsy API |

---

## What Each Sub-Menu Contains

### 📣 Marketing
- 🇲🇦 Morocco Trends Poster — fetch trends → AI poster → send for approval
- 📅 AI Content Calendar — generate weekly plan from trends
- ♻️ Content Repurposing — turn articles into all social formats
- 🔥 Viral Hook Generator — 10 viral ideas + top 3 with images
- 🕵️ Competitor Spy — scrape competitors, get intelligence report
- 🔍 SEO Monitor — check keyword rankings
- 🤝 Influencer Outreach — find and score influencers
- 📱 Social Autopilot — post scheduled content now
- 📸 UGC Collector — find user content to repost
- 🗓️ Seasonal Campaign — detect upcoming events, generate campaign
- ⭐ Reputation Manager — scan reviews + mentions

### 💌 Engagement
- 📰 Smart Newsletter — generate + send weekly newsletter
- 💤 Re-engagement — run campaign for inactive users
- 💎 Upgrade Nudge — email free users who hit limits
- 🎯 Recommendations — send personalized lesson suggestions
- 🏆 Milestones — check and celebrate user achievements

### 📊 Analytics
- 📈 Growth Dashboard — full weekly stats report
- ⚠️ Churn Predictor — identify at-risk users
- 🧪 A/B Test — generate content variations for testing

### 🚀 Growth
- 🔗 Referral Report — referral stats + top referrers
- 🌀 Lead Funnel — active leads status

### ⚡ Status
- Live platform stats (users, lessons, news, teachers, instructors)
- Backend and N8N health check

---

## How Sub-Workflows Connect Back to Telegram

Every sub-workflow must:

### 1. Accept a Webhook Trigger node
Each workflow needs a **Webhook** node with a specific path so the bot can trigger it:

```
Workflow: Morocco Trends Poster
Webhook path: /webhook/run-trends-poster

Workflow: Smart Newsletter
Webhook path: /webhook/run-newsletter
```

### 2. Extract chatId from the webhook body
The bot sends `chatId` in the POST body. Each workflow must read it:

```javascript
// In a Code node at the start of each workflow:
const chatId = $input.first().json.body?.chatId || 'YOUR_DEFAULT_CHAT_ID';
```

### 3. Send all results to that chatId
Replace hardcoded `YOUR_TELEGRAM_CHAT_ID` in every node with:
```
={{ $('Get ChatId').first().json.chatId }}
```

---

## Adding Webhook Trigger to Each Workflow

For EACH existing workflow, add this at the beginning:

### Node 1: Webhook Trigger
```json
{
  "type": "n8n-nodes-base.webhook",
  "parameters": {
    "httpMethod": "POST",
    "path": "run-WORKFLOW-NAME",
    "responseMode": "responseNode"
  }
}
```

### Node 2: Extract ChatId (Code node)
```javascript
const body = $input.first().json.body || {};
const chatId = body.chatId || 'YOUR_DEFAULT_CHAT_ID';
return [{ json: { chatId, triggeredFrom: body.triggeredFrom || 'manual' } }];
```

Connect: Webhook → Extract ChatId → rest of workflow

---

## Webhook Path Reference

| Workflow | Webhook Path |
|----------|-------------|
| Morocco Trends Poster | `/webhook/run-trends-poster` |
| AI Content Calendar | `/webhook/run-content-calendar` |
| Content Repurposing | `/webhook/run-repurpose` |
| Viral Hook Generator | `/webhook/run-viral-hooks` |
| Competitor Spy | `/webhook/run-competitor-spy` |
| SEO Monitor | `/webhook/run-seo-monitor` |
| Influencer Outreach | `/webhook/run-influencer` |
| Social Autopilot | `/webhook/run-social-autopilot` |
| UGC Collector | `/webhook/run-ugc` |
| Seasonal Campaign | `/webhook/run-seasonal` |
| Reputation Manager | `/webhook/run-reputation` |
| Smart Newsletter | `/webhook/run-newsletter` |
| Re-engagement | `/webhook/run-reengagement` |
| Upgrade Nudge | `/webhook/run-upgrade-nudge` |
| Recommendations | `/webhook/run-recommendations` |
| Milestones | `/webhook/run-milestones` |
| Growth Dashboard | `/webhook/run-growth-dashboard` |
| Churn Predictor | `/webhook/run-churn` |
| A/B Test | `/webhook/run-ab-test` |
| Referral Report | `/webhook/run-referral-report` |
| Lead Funnel | `/webhook/run-lead-funnel` |

---

## Setup Steps

1. **Import** `telegram-command-center.json` into n8n
2. **Set Telegram credential** on all Telegram nodes in the command center
3. **Activate** the command center workflow
4. **Import** all other workflow JSONs
5. **Add Webhook trigger node** to each workflow (see above)
6. **Replace** all hardcoded chat IDs with dynamic `chatId` from webhook body
7. **Activate** all workflows
8. Open Telegram → message your bot → `/start`

---

## Approval Flow (All Workflows)

When a workflow generates content needing approval, it sends to Telegram with buttons:

```
[✅ Approve & Post]  [❌ Reject]  [🔄 Regenerate]
```

These callbacks are handled by the **Command Center** workflow which routes:
- `approve` → posts to social media
- `reject` → notifies and stops
- `regenerate` → re-triggers the workflow
