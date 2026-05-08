# Morocco Trends Poster Workflow - Setup Guide

## Architecture (2 workflows)

```
WORKFLOW 1: "Morocco Trends → Poster → Approve → Post"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Schedule 9AM] → [Fetch Morocco Trends] → [Parse RSS] → [AI: Pick Trend + Write Concept]
    → [Parse AI JSON] → [DALL-E: Generate Poster] → [Download Image]
    → [Save to Google Drive] → [Send to Telegram with Approve/Reject/Regenerate buttons]


WORKFLOW 2: "Poster Approval Handler (Telegram Callback)"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Telegram Trigger: Button Click] → [Parse Callback]
    → [Switch: approve / reject / regenerate]
        ├── ✅ Approve → [Post Facebook] + [Post Instagram] → [Telegram: Confirm Posted]
        ├── ❌ Reject → [Telegram: Rejected notification]
        └── 🔄 Regenerate → [Trigger main workflow again] → [Telegram: Regenerating...]
```

## Required Credentials

### 1. OpenAI API
- Go to: Settings → Credentials → Add → OpenAI
- Enter your API key from https://platform.openai.com/api-keys
- Used for: GPT-4o (content creation) + DALL-E 3 (poster generation)

### 2. Telegram Bot
- Create bot via @BotFather on Telegram
- Get the bot token
- Get your chat ID: message your bot, then visit `https://api.telegram.org/bot<TOKEN>/getUpdates`
- Go to: Settings → Credentials → Add → Telegram
- Replace `YOUR_TELEGRAM_CHAT_ID` in both workflows with your actual chat ID

### 3. Google Drive
- Go to: Settings → Credentials → Add → Google Drive (OAuth2)
- Connect your Google account
- Create a folder in Drive called "Udarsy Posters" and set it in the "Save to Google Drive" node
- Make sure the uploaded files are set to "Anyone with link can view" (needed for social media posting)

### 4. Facebook Page + Instagram Business
- You need a Facebook Page and linked Instagram Business account
- Get a Page Access Token from https://developers.facebook.com
- Set these as n8n environment variables:
  - `FB_PAGE_ID` - Your Facebook Page ID
  - `FB_PAGE_ACCESS_TOKEN` - Long-lived Page Access Token
  - `IG_BUSINESS_ACCOUNT_ID` - Your Instagram Business Account ID

## Environment Variables (n8n)

Set these in your n8n instance (Settings → Variables, or in docker-compose):

```
FB_PAGE_ID=your_page_id
FB_PAGE_ACCESS_TOKEN=your_long_lived_token
IG_BUSINESS_ACCOUNT_ID=your_ig_id
N8N_WEBHOOK_URL=http://localhost:5678
```

Or in your Docker Compose:
```yaml
environment:
  - FB_PAGE_ID=your_page_id
  - FB_PAGE_ACCESS_TOKEN=your_token
  - IG_BUSINESS_ACCOUNT_ID=your_ig_id
```

## Import Instructions

1. Open n8n at `http://localhost:5678`
2. Go to Workflows → Import from File
3. Import `morocco-trends-poster.json` first
4. Import `morocco-trends-approval-handler.json` second
5. Open each workflow and update:
   - Credential references (click each node and select your credentials)
   - `YOUR_TELEGRAM_CHAT_ID` → your actual chat ID
   - Google Drive folder selection
6. Activate BOTH workflows

## How It Works

### Daily Flow:
1. **9:00 AM** - Schedule triggers automatically
2. **Trends** - Fetches Google Trends RSS for Morocco (geo=MA)
3. **AI Analysis** - GPT-4o picks the best trend and creates:
   - Poster title + subtitle
   - Visual description
   - DALL-E image prompt
   - Social media caption with hashtags
   - Chooses angle: funny / informative / inspirational / educational / meme
4. **Image Generation** - DALL-E 3 creates a 1024x1024 HD poster
5. **Google Drive** - Poster saved with timestamp filename
6. **Telegram** - You receive the poster with full details and 3 buttons:
   - ✅ **Approve & Post** - Posts to Facebook + Instagram, confirms via Telegram
   - ❌ **Reject** - Kills the flow, notifies you
   - 🔄 **Regenerate** - Triggers a new poster generation

### Manual Trigger:
- You can also run Workflow 1 manually anytime from the n8n UI

## Customization

### Change posting time:
Edit the "Daily 9AM Trigger" node → change `triggerAtHour`

### Add more social media:
In Workflow 2, add nodes after the Switch "approve" output:
- Twitter/X: Use HTTP Request with Twitter API v2
- LinkedIn: Use HTTP Request with LinkedIn API
- TikTok: Use HTTP Request with TikTok API

### Change trends source:
- Replace `geo=MA` with any country code (e.g., `DZ` for Morocco, `TN` for Tunisia)
- Or use SerpAPI for richer trend data

### Change AI model:
- Swap GPT-4o for Claude, Gemini, or any other model
- Swap DALL-E for Stability AI, Midjourney API, or Ideogram

### Change poster style:
Edit the system prompt in "AI - Create Poster Concept" to change:
- Visual style preferences
- Language preferences (Darija, French, English, MSA)
- Tone (more funny, more professional, etc.)
- Brand guidelines (colors, fonts to mention in prompts)
