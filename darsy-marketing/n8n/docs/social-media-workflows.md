# Social Media Automation Workflows - Documentation

## Overview
5 workflows that automate your entire social media presence across all platforms.

---

## 1. Social Media Autopilot
**File:** `workflows/marketing/social-media-autopilot.json`

```
[Hourly] → [Read Content Calendar from Google Sheets]
  → [Filter: Posts scheduled for now]
  → [Switch by platform]
    ├── Facebook → [Graph API: Post photo/text]
    ├── Instagram → [IG API: Create → Publish]
    ├── Twitter/X → [API v2: Tweet]
    ├── LinkedIn → [API: Share]
    └── TikTok → [API: Upload]
  → [Update Sheets: "posted" + post URLs]
  → [Daily summary to Telegram]
```

**Content Calendar Sheet Format:**

| Date | Time | Platform | Text | Image_URL | Status | Post_URL |
|------|------|----------|------|-----------|--------|----------|
| 2026-04-03 | 09:00 | instagram | Caption... | drive.google.com/... | scheduled | |
| 2026-04-03 | 10:00 | facebook | Caption... | drive.google.com/... | scheduled | |

---

## 2. Social Listening & Engagement
**File:** `workflows/marketing/social-listening-engagement.json`

```
[Every 30min] → [Search: Twitter + FB + IG mentions]
  → [AI: Classify sentiment]
    ├── Positive → [Auto-reply: "Thank you!"]
    ├── Negative → [ALERT to Telegram immediately]
    ├── Question → [AI answer → Telegram approval → Reply]
    └── Spam → [Log and ignore]
  → [Save all to Sheets] → [Daily sentiment report]
```

**Keywords monitored:** "Darsy", "دارسي", "DarsyApp", "@darsy"

---

## 3. UGC Collector
**File:** `workflows/marketing/ugc-collector.json`

```
[Every 2h] → [Search hashtags: #Darsy #دارسي]
  → [AI: Filter quality content]
  → [Download media → Google Drive "UGC" folder]
  → [AI: Write repost caption with credit]
  → [Telegram: "Approve repost?"]
  → [If approved: Repost on Darsy accounts]
```

---

## 4. Viral Hook Generator
**File:** `workflows/marketing/viral-hook-generator.json`

```
[Daily 7AM] → [Google Trends: Morocco]
  → [Darsy latest stats/content]
  → [GPT-4o: Generate 10 viral hooks]
  → [Score each 1-10 virality potential]
  → [Pick top 3] → [DALL-E: Visual for each]
  → [Save to Drive] → [Send 3 options to Telegram]
```

---

## 5. Influencer Outreach
**File:** `workflows/marketing/influencer-outreach.json`

```
[Weekly Monday] → [Search: Education influencers in DZ/MA]
  → [AI: Score relevance (audience, engagement)]
  → [Filter: >3% engagement, >5K followers]
  → [AI: Write personalized DM/email]
  → [Save to "Influencer Pipeline" sheet]
  → [Top 5 to Telegram for approval]
  → [If approved: Send outreach]
```

---

## Platform API Setup

### Facebook & Instagram
1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create an app → Add Facebook Login + Instagram Basic Display
3. Get a **Page Access Token** (long-lived, 60 days)
4. Get your **Page ID** and **IG Business Account ID**
5. Required permissions: `pages_manage_posts`, `instagram_basic`, `instagram_content_publish`

### Twitter/X
1. Go to [developer.twitter.com](https://developer.twitter.com)
2. Create project + app → Get API Key, Secret, Bearer Token
3. Set OAuth 2.0 with read+write permissions
4. Use OAuth 2.0 PKCE for posting

### LinkedIn
1. Go to [linkedin.com/developers](https://linkedin.com/developers)
2. Create app → Request `w_member_social` permission
3. Get OAuth 2.0 tokens

### TikTok
1. Go to [developers.tiktok.com](https://developers.tiktok.com)
2. Create app → Request Video Publish permission
3. Use Content Posting API

---

## Required Credentials (n8n)
- **OpenAI API** - AI content and image generation
- **Google Sheets OAuth2** - Content calendar and logging
- **Google Drive OAuth2** - Image storage
- **Telegram Bot** - Notifications and approval
- **Facebook/Instagram** - Graph API access token
- **Twitter/X** - API v2 credentials
- **LinkedIn** - OAuth2 credentials
- **SerpAPI** (optional) - For influencer search

## Environment Variables
```
FB_PAGE_ID=your_page_id
FB_PAGE_ACCESS_TOKEN=your_token
IG_BUSINESS_ACCOUNT_ID=your_ig_id
TWITTER_BEARER_TOKEN=your_token
CONTENT_SHEET_ID=your_google_sheet_id
SERPAPI_KEY=your_key
```
