# AI & Advanced Workflows - Documentation

## Overview
6 advanced workflows using AI agents, chatbots, and intelligent automation.

---

## 1. AI Social Media Manager Agent
**File:** `workflows/marketing/ai-social-media-manager.json`

```
[Daily 8AM] → [AI Agent with tools]:
  Tools:
  ├── Fetch Google Trends
  ├── Read Content Calendar (Sheets)
  ├── Check yesterday's analytics
  ├── Generate images (DALL-E)
  ├── Check Udarsy stats (API)
  └── Write posts (internal)
→ [Agent outputs 3 optimized posts]
→ [Send all to Telegram with approval buttons]
→ [Post approved ones to social media]
```

**Agent System Prompt highlights:**
- Understands Moroccan audience
- Mixes Arabic Darija, French, and English
- Optimizes posting times for North Africa
- Analyzes yesterday's performance to improve today

---

## 2. AI Support Chatbot (Telegram)
**File:** `workflows/engagement/ai-support-chatbot.json`

```
[Telegram: Any message to bot] → [Check if known user]
  → [AI Agent with RAG knowledge base]:
    Knowledge: Udarsy FAQ, pricing, features, troubleshooting
    Tools: Check subscription, search lessons, check platform status
  → [If confidence < 70%: Escalate to admin Telegram]
  → [If confident: Auto-reply to user]
  → [Log all conversations to Sheets]
```

**Knowledge Base (add to AI prompt):**
- Pricing: Free / Pro (100 MAD/mo) / Premium (200 MAD/mo)
- Features per plan
- How to sign up, reset password, change plan
- Common issues and fixes
- Contact info for human support

---

## 3. Personalized Recommendations
**File:** `workflows/marketing/personalized-recommendations.json`

```
[Daily 10AM] → [MongoDB: Active users (last 2 days)]
  → [Loop each user]:
    → [Fetch their progress/favorites/completed]
    → [AI: 3 personalized lesson recommendations]
    → [Send personalized email]
    → [Log to Sheets]
  → [End loop]
```

**AI considers:**
- Current subjects and level
- Completed vs. remaining lessons
- Favorite topics
- Time spent patterns
- Popular lessons in their track

---

## 4. Review & Reputation Manager
**File:** `workflows/marketing/review-reputation-manager.json`

```
[Every 4 hours] → Parallel fetch:
  ├── [SerpAPI: Google search mentions]
  ├── [Facebook: Page reviews]
  └── [Udarsy API: Platform feedback]
→ [Merge all sources]
→ [AI: Classify each item]:
    sentiment, severity (1-5), suggested response, auto_reply flag
→ [If urgent: Telegram alert immediately]
→ [Log reputation score to Sheets]
```

**AI classification outputs:**
| Sentiment | Action |
|-----------|--------|
| Positive | Auto-reply with thanks |
| Negative | Alert Telegram for human review |
| Neutral | Log only |
| Question | AI-generate answer, send for approval |
| Feature request | Add to feature tracking sheet |

---

## 5. Seasonal Campaign Engine
**File:** `workflows/marketing/seasonal-campaign-engine.json`

```
[Daily 7AM] → [Code: Check upcoming dates (hardcoded calendar)]
  → [If event within 7 days]:
    → [AI: Generate complete campaign]:
      - 5+ social media posts (countdown series)
      - Email campaign copy
      - Special offer with promo code
      - Campaign poster
    → [DALL-E: Campaign poster]
    → [Save to Content Calendar sheet]
    → [Send to Telegram for approval]
```

**Moroccan Calendar Events:**
| Month | Events |
|-------|--------|
| Jan | New Year, Throne Day (Fête du Trône) |
| Feb | Valentine's Day |
| Mar | Women's Day, Spring Break, 2nd Trimester Exams |
| May | Labour Day, BAC Prep Season, 3rd Trimester Exams |
| Jun | BAC Exams, Brevet Exams, Children's Day |
| Jul | Independence Day |
| Sep | Back to School |
| Oct | Teacher's Day |
| Nov | Revolution Day |
| Dec | Winter Break |
| Variable | Ramadan, Eid al-Fitr, Eid al-Adha |

**Note:** Ramadan/Eid dates are not hardcoded (they follow lunar calendar). Add them manually each year or use an Islamic calendar API.

---

## 6. WhatsApp Community Bot
**File:** `workflows/integrations/whatsapp-community-bot.json`

```
[WhatsApp Webhook: New message] → [Parse message]
  → [AI: Classify intent + generate response]
    ├── Question → [AI auto-answer] → [Reply on WhatsApp]
    ├── Feedback → [Save to DB] → [Thank user] → [Alert admin]
    ├── Bug report → [Create issue in sheet] → [Acknowledge]
    └── Other → [Friendly response]
  → [If needs escalation: Forward to Telegram]
  → [Log all to Sheets]
```

**WhatsApp Business API Setup:**
1. Go to [business.facebook.com](https://business.facebook.com)
2. Create a WhatsApp Business account
3. Add a phone number
4. In Meta Developer portal → Create app → Add WhatsApp product
5. Get your **Phone Number ID** and **Permanent Token**
6. Set webhook URL to your n8n webhook endpoint
7. Subscribe to `messages` webhook field

**Environment variables:**
```
WHATSAPP_PHONE_ID=your_phone_number_id
WHATSAPP_TOKEN=your_permanent_token
```

---

## Required Credentials
- **OpenAI API** - GPT-4o for AI agents + DALL-E for images
- **MongoDB** - User data access
- **Google Sheets** - Logging and tracking
- **Google Drive** - File storage
- **Telegram Bot** - Notifications and chatbot
- **SerpAPI** - Google search monitoring
- **Facebook/Instagram** - Social media APIs
- **WhatsApp Business** - WhatsApp Cloud API
- **SMTP/SendGrid** - Email sending

## Cost Estimates (Monthly)
| Service | Estimated Cost |
|---------|---------------|
| OpenAI GPT-4o | $20-50 (depends on volume) |
| OpenAI DALL-E 3 | $10-30 (image generation) |
| SerpAPI | $50 (5000 searches/mo plan) |
| SendGrid | Free tier (100 emails/day) |
| WhatsApp Business | Free (first 1000 conversations/mo) |
| Google Sheets/Drive | Free |
| Telegram Bot | Free |
| **Total** | **~$80-130/month** |

## Prompt Engineering Tips for Moroccan Market
1. Always include Darija/French context in system prompts
2. Reference local events and cultural moments
3. Use MAD for pricing, not USD
4. Mention specific exam types (BAC, Brevet)
5. Reference the Moroccan school system structure
6. Include bilingual output options (Arabic + French)
