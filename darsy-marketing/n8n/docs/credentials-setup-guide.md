# Complete Credentials Setup Guide

## How to Add Any Credential in n8n

1. Open `http://localhost:5678`
2. Click **Settings** (bottom-left gear icon)
3. Click **Credentials**
4. Click **Add credential** (top-right)
5. Search for the credential name
6. Fill in the fields
7. Click **Save**

Then in each workflow node, click the node → find the **Credential** dropdown → select the one you just saved.

---

# CREDENTIAL 1: OpenAI API

### Step 1 — Get your API Key
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click **+ Create new secret key**
4. Name it "Darsy n8n"
5. Copy the key (starts with `sk-...`) — **you only see it once**

### Step 2 — Add to n8n
1. n8n → Settings → Credentials → Add credential
2. Search: **OpenAI**
3. Select **OpenAI API**
4. Fill in:
   ```
   API Key: sk-xxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Click **Save**
6. Name it: `OpenAI API`

### Step 3 — Use in workflows
- Open any workflow that has an OpenAI node
- Click the node (e.g., "AI - Create Poster Concept")
- Find **Credential** field → select `OpenAI API`

---

# CREDENTIAL 2: Telegram Bot

### Step 1 — Create your bot
1. Open Telegram → search **@BotFather**
2. Send: `/newbot`
3. Enter a name: `Darsy Marketing Bot`
4. Enter a username: `darsy_marketing_bot` (must end in "bot")
5. BotFather sends you a token like:
   ```
   7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
6. Copy that token

### Step 2 — Get your Chat ID
1. Open Telegram → search your new bot → click **Start**
2. Send it any message (e.g., "hello")
3. Open this URL in your browser (replace TOKEN):
   ```
   https://api.telegram.org/bot7123456789:AAHxxx.../getUpdates
   ```
4. Look for `"chat":{"id":` — copy that number (e.g., `123456789`)

### Step 3 — Add to n8n
1. n8n → Settings → Credentials → Add credential
2. Search: **Telegram**
3. Select **Telegram API**
4. Fill in:
   ```
   Access Token: 7123456789:AAHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
5. Click **Save**
6. Name it: `Telegram Bot`

### Step 4 — Put your Chat ID in workflows
- Open each workflow
- Find any Telegram node
- In the **Chat ID** field, type your chat ID number (e.g., `123456789`)
- Replace every `YOUR_TELEGRAM_CHAT_ID` placeholder

---

# CREDENTIAL 3: Google Drive

### Step 1 — Create Google Cloud Project
1. Go to https://console.cloud.google.com
2. Click **Select a project** → **New Project**
3. Name: `Darsy n8n` → Click **Create**
4. Make sure your new project is selected

### Step 2 — Enable APIs
1. Go to **APIs & Services** → **Library**
2. Search and enable these 2 APIs:
   - **Google Drive API** → Enable
   - **Google Sheets API** → Enable

### Step 3 — Create OAuth2 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If asked to configure consent screen:
   - User type: **External** → Create
   - App name: `Darsy n8n`
   - User support email: your email
   - Developer email: your email
   - Click **Save and Continue** (skip other steps)
   - Click **Back to Dashboard**
4. Back to **Create OAuth client ID**:
   - Application type: **Web application**
   - Name: `Darsy n8n`
   - Authorized redirect URIs → Add:
     ```
     http://localhost:5678/rest/oauth2-credential/callback
     ```
5. Click **Create**
6. Copy **Client ID** and **Client Secret**

### Step 4 — Add to n8n
1. n8n → Settings → Credentials → Add credential
2. Search: **Google Drive**
3. Select **Google Drive OAuth2 API**
4. Fill in:
   ```
   Client ID: xxxxxxxxxxxx.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxxxxxxxxxxxxx
   ```
5. Click **Sign in with Google** → authorize with your Google account
6. Click **Save**
7. Name it: `Google Drive`

---

# CREDENTIAL 4: Google Sheets

### Step 1
- Same Google Cloud project from above (APIs already enabled)
- Same Client ID and Client Secret

### Step 2 — Add to n8n
1. n8n → Settings → Credentials → Add credential
2. Search: **Google Sheets**
3. Select **Google Sheets OAuth2 API**
4. Fill in the **same Client ID and Client Secret** from above
5. Click **Sign in with Google** → authorize
6. Click **Save**
7. Name it: `Google Sheets`

### Step 3 — Create your tracking spreadsheet
1. Go to https://sheets.google.com
2. Create a new spreadsheet
3. Name it: `Darsy Marketing Automation`
4. Create these tabs (click + at the bottom):
   - `Content_Calendar`
   - `AB_Tests`
   - `AB_Results`
   - `Referrals`
   - `Leads`
   - `Email_Log`
   - `Reputation_Log`
   - `WhatsApp_Log`
   - `Achievements`
5. Copy the Sheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/  1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms  /edit
                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                              This is your Sheet ID
   ```

### Step 4 — Set Sheet ID in n8n
- Open each workflow that uses Google Sheets
- Click the Google Sheets node
- In **Document** field → paste your Sheet ID
- In **Sheet Name** field → select the correct tab

---

# CREDENTIAL 5: Facebook & Instagram

### Step 1 — Create Facebook App
1. Go to https://developers.facebook.com
2. Click **My Apps** → **Create App**
3. Select **Business** → Next
4. App name: `Darsy Social` → Create app

### Step 2 — Add products
1. In your app dashboard → click **Add Product**
2. Find **Facebook Login** → click **Set Up**
3. Find **Instagram Graph API** → click **Set Up**

### Step 3 — Get Page Access Token
1. In left sidebar → **Tools** → **Graph API Explorer**
2. Top right: Select your app (`Darsy Social`)
3. Click **Generate Access Token**
4. Permissions to add (click Add a Permission):
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `instagram_basic`
   - `instagram_content_publish`
5. Click **Generate Access Token** → authorize
6. Copy the token shown

### Step 4 — Make it Long-Lived (important!)
The default token expires in 1 hour. Make it long-lived (60 days):

1. Still in Graph API Explorer
2. Paste this URL and click Submit (replace YOUR_APP_ID, YOUR_APP_SECRET, YOUR_TOKEN):
   ```
   GET /oauth/access_token
   ?grant_type=fb_exchange_token
   &client_id=YOUR_APP_ID
   &client_secret=YOUR_APP_SECRET
   &fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
   ```
3. Copy the new long-lived token

### Step 5 — Get your Page ID
1. Go to your Facebook Page
2. Click **About** (or Settings)
3. Scroll down to find **Page ID** (a long number)

### Step 6 — Get Instagram Business Account ID
1. In Graph API Explorer, run:
   ```
   GET /me/accounts
   ```
2. Find your page → copy the `id`
3. Then run:
   ```
   GET /{page-id}?fields=instagram_business_account
   ```
4. Copy the Instagram account `id`

### Step 7 — Add to n8n Environment Variables
You don't add Facebook as a credential — you use environment variables.

**If using docker-compose.yml**, add under `environment:`:
```yaml
- FB_PAGE_ID=123456789012345
- FB_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
- IG_BUSINESS_ACCOUNT_ID=987654321098765
```

**If running docker run**, add flags:
```bash
-e FB_PAGE_ID=123456789012345
-e FB_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxx
-e IG_BUSINESS_ACCOUNT_ID=987654321098765
```

Then restart: `docker restart <your-n8n-container>`

---

# CREDENTIAL 6: Email (SendGrid)

### Step 1 — Create SendGrid account
1. Go to https://sendgrid.com → Sign up free
2. Free tier: 100 emails/day (enough to start)
3. Verify your email

### Step 2 — Create API Key
1. SendGrid dashboard → **Settings** → **API Keys**
2. Click **Create API Key**
3. Name: `Darsy n8n`
4. Permission: **Full Access** (or Restricted: Mail Send)
5. Click **Create & View**
6. Copy the key (starts with `SG.`)

### Step 3 — Verify sender email
1. SendGrid → **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Add your sender email (e.g., `noreply@darsy.app`)
4. Verify it via the email they send you

### Step 4 — Add to n8n
1. n8n → Settings → Credentials → Add credential
2. Search: **Send Email** or **SMTP**
3. Select **SMTP**
4. Fill in:
   ```
   Host: smtp.sendgrid.net
   Port: 587
   User: apikey
   Password: SG.xxxxxxxxxxxxxxxxxxxxxxxx   ← your API key
   ```
5. Click **Save**
6. Name it: `SendGrid SMTP`

---

# CREDENTIAL 7: MongoDB

### Step 1 — Get your connection string
Your MongoDB is already running (Darsy backend uses it). The connection string is in:
```
darsy-backend/src/config/database.ts
```
or in your `.env` file — look for `MONGODB_URI` or `MONGO_URL`.

It looks like:
```
mongodb://localhost:27017/darsy
```
or
```
mongodb+srv://username:password@cluster.mongodb.net/darsy
```

### Step 2 — Important: Docker networking
Since n8n runs in Docker and MongoDB might run on your host machine, use:
```
mongodb://host.docker.internal:27017/darsy
```
instead of `localhost`

### Step 3 — Add to n8n
1. n8n → Settings → Credentials → Add credential
2. Search: **MongoDB**
3. Select **MongoDB**
4. Fill in:
   ```
   Connection String: mongodb://host.docker.internal:27017/darsy
   Database: darsy
   ```
5. Click **Save**
6. Name it: `MongoDB Darsy`

---

# CREDENTIAL 8: SerpAPI (SEO & Search)

### Step 1 — Create account
1. Go to https://serpapi.com
2. Sign up → free plan gives 100 searches/month
3. Dashboard → copy your **API Key**

### Step 2 — Add as environment variable
```yaml
# In docker-compose.yml
- SERPAPI_KEY=your_key_here
```

---

# SETTING ENVIRONMENT VARIABLES (All at once)

## Option A: Edit docker-compose.yml

Find your n8n docker-compose file and add all variables:

```yaml
version: '3'
services:
  n8n:
    image: n8nio/n8n
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - WEBHOOK_URL=http://localhost:5678/
      # ─── ADD YOUR VALUES BELOW ───
      - FB_PAGE_ID=PUT_YOUR_PAGE_ID_HERE
      - FB_PAGE_ACCESS_TOKEN=PUT_YOUR_TOKEN_HERE
      - IG_BUSINESS_ACCOUNT_ID=PUT_YOUR_IG_ID_HERE
      - SERPAPI_KEY=PUT_YOUR_SERPAPI_KEY_HERE
      - WHATSAPP_PHONE_ID=PUT_YOUR_WA_PHONE_ID_HERE
      - WHATSAPP_TOKEN=PUT_YOUR_WA_TOKEN_HERE
      - N8N_WEBHOOK_URL=http://localhost:5678
      - CONTENT_SHEET_ID=PUT_YOUR_GOOGLE_SHEET_ID_HERE
    volumes:
      - n8n_data:/home/node/.n8n
```

Then restart:
```bash
docker-compose down && docker-compose up -d
```

## Option B: No docker-compose (docker run)

```bash
docker stop n8n
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -e FB_PAGE_ID=your_page_id \
  -e FB_PAGE_ACCESS_TOKEN=your_token \
  -e IG_BUSINESS_ACCOUNT_ID=your_ig_id \
  -e SERPAPI_KEY=your_key \
  -e CONTENT_SHEET_ID=your_sheet_id \
  -e N8N_WEBHOOK_URL=http://localhost:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n
```

---

# QUICK CHECKLIST

Copy this and check off as you go:

```
CREDENTIALS IN N8N UI:
[ ] OpenAI API key added
[ ] Telegram Bot token added
[ ] Google Drive OAuth2 connected
[ ] Google Sheets OAuth2 connected
[ ] MongoDB connection string added
[ ] SendGrid/SMTP added

ENVIRONMENT VARIABLES IN DOCKER:
[ ] FB_PAGE_ID set
[ ] FB_PAGE_ACCESS_TOKEN set
[ ] IG_BUSINESS_ACCOUNT_ID set
[ ] SERPAPI_KEY set
[ ] CONTENT_SHEET_ID set

IN WORKFLOWS (manual edits):
[ ] All Telegram nodes: replace YOUR_TELEGRAM_CHAT_ID
[ ] Google Drive nodes: select your Drive folder
[ ] Google Sheets nodes: select your spreadsheet + tab

GOOGLE SHEETS SETUP:
[ ] Spreadsheet created with all required tabs
[ ] Sheet ID copied and set in CONTENT_SHEET_ID env var

BACKEND INTEGRATION:
[ ] Webhook call added to register endpoint (referral tracking)
[ ] Webhook call added to progress controller (achievement sharing)
```
