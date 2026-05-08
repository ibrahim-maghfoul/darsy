# Udarsy Content Marketing Automation - n8n Workflows

## Architecture Overview

```
+------------------------------------------------------------------+
|                    UDARSY MARKETING AUTOMATION                      |
|                        (n8n Workflows)                             |
+------------------------------------------------------------------+
|                                                                    |
|  TRIGGERS           PROCESSING            OUTPUTS                  |
|  --------           ----------            -------                  |
|                                                                    |
|  [Every 6h] -----> Content Repurposing --> Google Sheets           |
|                     Engine                  + Telegram              |
|                     (GPT-4o)                                       |
|                                                                    |
|  [Daily 7AM] ----> SEO Keyword ----------> Google Sheets           |
|                     Monitor                 + Telegram              |
|                     (SerpAPI + GPT-4o)                             |
|                                                                    |
|  [Daily 10AM] ---> Competitor Spy -------> Google Sheets           |
|                     (HTTP + GPT-4o)         + Telegram              |
|                                                                    |
|  [Mon 8AM] ------> AI Content Calendar --> Google Sheets           |
|                     (Trends + GPT-4o)       + Telegram              |
|                                                                    |
+------------------------------------------------------------------+
|                                                                    |
|  DATA SOURCES                    EXTERNAL SERVICES                 |
|  ------------                    -----------------                 |
|  Udarsy API (localhost:5000)      OpenAI GPT-4o                     |
|    /api/news                     SerpAPI                           |
|    /api/data/stats               Google Sheets                     |
|    /api/calendar/global          Google Trends                     |
|                                  Telegram Bot                      |
+------------------------------------------------------------------+
```

## Workflows Summary

| Workflow | File | Schedule | Purpose |
|---|---|---|---|
| Content Repurposing Engine | `content-repurposing-engine.json` | Every 6 hours | Converts blog posts into multi-platform content |
| SEO Keyword Monitor | `seo-keyword-monitor.json` | Daily 7:00 AM CET | Tracks 20 keywords and detects ranking changes |
| Competitor Spy | `competitor-spy.json` | Daily 10:00 AM CET | Monitors competitor pages for changes |
| AI Content Calendar | `ai-content-calendar.json` | Every Monday 8:00 AM CET | Generates a full weekly content plan |

---

## Required Credentials

You must configure the following credentials in your n8n instance before activating the workflows.

### 1. OpenAI API

- **Type:** OpenAI API Key
- **Used by:** All 4 workflows (GPT-4o calls)
- **Setup:** Go to n8n Credentials > Add Credential > OpenAI API. Paste your API key from https://platform.openai.com/api-keys
- **Placeholder in JSON:** `OPENAI_CREDENTIAL_ID`
- **Estimated cost:** ~$0.50-2.00/day depending on content volume

### 2. Google Sheets OAuth2

- **Type:** Google Sheets OAuth2 API
- **Used by:** All 4 workflows (data storage and retrieval)
- **Setup:**
  1. Create a Google Cloud project
  2. Enable Google Sheets API
  3. Create OAuth2 credentials (web application type)
  4. In n8n: Credentials > Add Credential > Google Sheets OAuth2 > paste Client ID and Client Secret
  5. Complete the OAuth flow
- **Placeholder in JSON:** `GOOGLE_SHEETS_CREDENTIAL_ID`

### 3. Telegram Bot

- **Type:** Telegram Bot API
- **Used by:** All 4 workflows (notifications)
- **Setup:**
  1. Message @BotFather on Telegram
  2. Create a new bot with `/newbot`
  3. Copy the bot token
  4. Get your chat ID (message @userinfobot or @raw_data_bot)
  5. In n8n: Credentials > Add Credential > Telegram API > paste token
- **Placeholder in JSON:** `TELEGRAM_CREDENTIAL_ID`
- **Chat ID placeholder:** `YOUR_TELEGRAM_CHAT_ID`

### 4. SerpAPI (SEO workflow only)

- **Type:** API Key (used inline in HTTP Request node)
- **Used by:** SEO Keyword Monitor
- **Setup:** Sign up at https://serpapi.com, get your API key
- **Placeholder in JSON:** `YOUR_SERPAPI_KEY`
- **Free tier:** 100 searches/month (sufficient for 20 keywords x 5 days)

---

## Setup Steps

### Step 1: Install n8n

```bash
# Using npm
npm install n8n -g
n8n start

# Or using Docker
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

n8n will be available at http://localhost:5678

### Step 2: Create Google Sheets

Create a single Google Spreadsheet with these tabs (sheets):

| Sheet Tab Name | Used By | Columns (auto-created on first run) |
|---|---|---|
| `Repurposed Content` | Content Repurposing Engine | article_id, platform, content_type, content_text, has_media, notes, suggested_time, generated_at, status |
| `SEO Rankings History` | SEO Keyword Monitor | keyword, language, udarsy_position, udarsy_url, udarsy_title, in_top_10, in_top_20, not_found, top_competitors, total_results, checked_at |
| `Competitor Snapshots` | Competitor Spy | competitor_name, url, category, current_title, current_meta, current_headings, current_links, text_preview, scraped_at |
| `Content Calendar` | AI Content Calendar | week_of, day, date, day_theme, platform, time, post_type, content, hashtags, media_needed, cta, notes, status, created_at |

Copy the spreadsheet ID from the URL (`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`) and replace all occurrences of `YOUR_GOOGLE_SHEET_ID` in the workflow JSONs.

### Step 3: Configure Credentials in n8n

1. Open n8n at http://localhost:5678
2. Go to **Settings** > **Credentials**
3. Add each credential listed above
4. Note the credential IDs that n8n assigns

### Step 4: Import Workflows

For each workflow JSON file:

1. In n8n, click **Add Workflow** > **Import from File**
2. Select the JSON file
3. After import, update all credential references:
   - Click each node that uses credentials
   - Select the correct credential from the dropdown
4. Update placeholders:
   - Replace `YOUR_TELEGRAM_CHAT_ID` in all Telegram nodes
   - Replace `YOUR_SERPAPI_KEY` in the SEO workflow
   - Replace `YOUR_GOOGLE_SHEET_ID` in all Google Sheets nodes

### Step 5: Test Each Workflow

1. Open each workflow
2. Click **Execute Workflow** (manual run)
3. Check each node's output for errors
4. Verify data appears in Google Sheets
5. Verify Telegram messages arrive

### Step 6: Activate

Toggle each workflow to **Active** so they run on schedule.

---

## Workflow Details

### 1. Content Repurposing Engine

**File:** `content-repurposing-engine.json`

**What it does:**
Every 6 hours, this workflow fetches the latest articles from the Udarsy news API, filters for articles published in the last 24 hours, and uses GPT-4o to repurpose each article into content for 6 platforms.

**Output per article:**
- 5 Twitter/X thread tweets
- 3 Instagram carousel slide texts + caption
- 1 LinkedIn professional post
- 1 Facebook engagement post
- 3 TikTok/Reels script ideas with hooks
- 1 Email newsletter snippet with subject line

**Node flow:**
```
Schedule (6h) -> HTTP: /api/news -> Code: Filter new articles
  -> IF: Has articles?
     YES -> GPT-4o: Repurpose -> Code: Parse & flatten
         -> Google Sheets: Save all -> Code: Build summary
         -> Telegram: Notify
     NO  -> NoOp (skip)
```

**AI prompt features:**
- Understands Arabic (MSA + Moroccan dialect), French, and English
- Preserves the original article's language
- Generates bilingual hashtags for cross-market reach
- Suggests optimal posting times for the CET timezone
- References BAC, Brevet, and Moroccan educational context

### 2. SEO Keyword Monitor

**File:** `seo-keyword-monitor.json`

**What it does:**
Every day at 7 AM, checks Google rankings for 20 keywords related to Moroccan education. Compares with previous rankings stored in Google Sheets and uses AI to analyze trends and suggest actions.

**Keywords tracked (20 total):**
- 10 Arabic: دروس بكالوريا, دروس الثانوي, تمارين بكالوريا, حوليات بكالوريا المغرب, دروس شهادة التعليم المتوسط, تحضير بكالوريا, ملخصات دروس, منصة تعليمية مغربية, دروس اون لاين المغرب, مواضيع محلولة بكالوريا
- 7 French: cours bac algerie, examens algerie, sujets bac algerie, cours en ligne algerie, revision Brevet algerie, plateforme educative algerie, preparation bac algerie
- 3 English: Morocco education platform, Moroccan baccalaureate prep, online courses Morocco

**Node flow:**
```
Schedule (7AM) -> Code: Define 20 keywords
  -> HTTP: SerpAPI (per keyword) -> Code: Extract Udarsy ranking
  -> Google Sheets: Read previous rankings
  -> Code: Compare current vs previous
  -> GPT-4o: Analyze changes
  -> Code: Build alert message
  -> Telegram: Send report + Google Sheets: Save history
```

**Alerts triggered when:**
- Any keyword moves 3+ positions (up or down)
- Udarsy enters or drops out of top 20
- AI detects a pattern worth acting on

### 3. Competitor Spy

**File:** `competitor-spy.json`

**What it does:**
Every day at 10 AM, scrapes competitor websites, extracts key content (titles, headings, meta descriptions, links), compares with the previous day's snapshot, and generates a competitive intelligence report.

**Competitors monitored:**
- **Eddirasa** (eddirasa.com) - Direct competitor, BAC/Brevet content
- **DzExams** (dzexams.com) - Direct competitor, exam-focused
- **El-Taalim** (el-taalim.com) - Direct competitor
- **ONEFD** (onefd.edu.dz) - Government distance learning
- **Coursera** - International comparison

**Node flow:**
```
Schedule (10AM) -> Code: Define competitor URLs
  -> HTTP: Scrape each page -> Code: Extract content
  -> Google Sheets: Read last snapshot
  -> Code: Compare snapshots
  -> GPT-4o: Generate intelligence report
  -> Code: Format report
  -> Telegram: Send report + Google Sheets: Save snapshot
```

**Report includes:**
- Executive summary of competitor landscape
- Detected changes per competitor (new content, features, SEO changes)
- Market trends observed across competitors
- Strategic recommendations with priority levels
- Content gaps Udarsy should fill

### 4. AI Content Calendar

**File:** `ai-content-calendar.json`

**What it does:**
Every Monday at 8 AM, gathers trending topics, Udarsy platform statistics, and upcoming events, then uses GPT-4o to generate a complete 7-day content calendar with specific posts for every platform.

**Data sources merged:**
- Google Trends Morocco (Arabic)
- Google Trends Morocco (French)
- Udarsy platform stats (`/api/data/stats`)
- Upcoming calendar events (`/api/calendar/global`)
- Moroccan academic calendar context (hardcoded: BAC June, Brevet May, etc.)

**Node flow:**
```
Schedule (Mon 8AM)
  -> [parallel] Google Trends DZ + Google Trends MA
                + Udarsy Stats API + Udarsy Calendar API
  -> Code: Merge all context
  -> GPT-4o: Generate 7-day calendar
  -> Code: Parse and flatten for Sheets
  -> Google Sheets: Save calendar + Code: Build summary
  -> Telegram: Send calendar preview
```

**Calendar output per week:**
- 7 days x 3 posts (Twitter, Instagram, Facebook) = 21 daily posts
- 2 LinkedIn thought leadership posts
- 3-4 TikTok/Reels with scripts and hooks
- 2 email newsletters with subject lines and section briefs
- Content pillar tagging (education, motivation, features, exam prep, community)

---

## Customization Options

### Changing Schedules

Each workflow starts with a Schedule Trigger node. To change timing:
1. Open the workflow
2. Click the Schedule node
3. Modify the cron expression or interval

Common cron expressions:
- `0 7 * * *` = Every day at 7:00 AM
- `0 8 * * 1` = Every Monday at 8:00 AM
- `0 */6 * * *` = Every 6 hours

### Adding Keywords (SEO Monitor)

Open `seo-keyword-monitor.json`, find the "Define Keywords" Code node, and add entries to the `keywords` array:
```javascript
{ keyword: 'your new keyword', language: 'ar', market: 'dz' }
```

### Adding Competitors

Open `competitor-spy.json`, find the "Define Competitors" Code node, and add entries to the `competitors` array with name, URLs, and social links.

### Changing AI Model

All workflows use `gpt-4o`. To switch models, update the `model` field in each OpenAI node. Options:
- `gpt-4o` - Best quality, higher cost
- `gpt-4o-mini` - Good quality, lower cost (recommended for budget-conscious usage)
- `gpt-4-turbo` - Alternative high-quality option

### Changing Target Platforms

The content repurposing prompt can be modified to add or remove platforms. Edit the system prompt in the "GPT-4o Repurpose Content" node and update the corresponding parsing logic in the "Parse & Flatten for Sheets" Code node.

### Adding Udarsy Domain

The SEO workflow looks for Udarsy in search results using these domains:
```javascript
const udarsyDomains = ['udarsy.io', 'udarsy.dz', 'udarsy.com', 'www.udarsy.io'];
```
Update this array in the "Extract Udarsy Ranking" Code node to match your actual domain.

### Notification Channel

All workflows notify via Telegram. To add additional channels (Slack, Discord, email), add output nodes after the summary/report building step and connect them in parallel with the Telegram node.

---

## Estimated Costs

| Service | Usage | Monthly Cost |
|---|---|---|
| OpenAI GPT-4o | ~120 calls/month (all workflows) | $15-40 |
| SerpAPI | ~600 searches/month (20 kw x 30 days) | $50 (or free tier: 100/mo) |
| Google Sheets | Storage | Free |
| Telegram Bot | Notifications | Free |
| n8n | Self-hosted | Free |
| **Total** | | **$15-90/month** |

To reduce costs, use `gpt-4o-mini` instead of `gpt-4o` and reduce SerpAPI checks to weekdays only.

---

## Troubleshooting

**Workflow fails at HTTP Request to Udarsy API:**
- Ensure the Udarsy backend is running at `http://localhost:5000`
- If n8n runs in Docker, use `http://host.docker.internal:5000` instead of `localhost`

**Google Sheets node fails:**
- Re-authenticate the Google Sheets credential
- Verify the sheet tab names match exactly (case-sensitive)
- Ensure the spreadsheet ID is correct

**GPT-4o returns unparseable response:**
- The Code nodes have fallback JSON extraction (handles markdown code blocks)
- If persistent, reduce the prompt complexity or lower `maxTokens`
- Check OpenAI API key has sufficient credits

**SerpAPI returns errors:**
- Verify API key is correct
- Check monthly quota (free tier = 100 searches)
- Some keywords with special characters may need URL encoding

**Telegram notifications not arriving:**
- Verify the bot token and chat ID
- Ensure you have started a conversation with the bot first
- Check that the bot has permission to send messages to the chat/group
