# Email & Engagement Workflows - Documentation

## Overview
5 workflows that automate the entire user lifecycle from signup to re-engagement.

---

## 1. Welcome Drip Sequence
**File:** `workflows/engagement/welcome-drip-sequence.json`

```
[Webhook: Signup] → [Wait 5min] → [Email 1: Welcome]
  → [Wait 1 day] → [Check onboarding] → [IF/ELSE]
    → Yes: [Email 2a: Praise] / No: [Email 2b: Nudge]
  → [Wait 2d] → [Email 3: Features]
  → [Wait 3d] → [Email 4: Community]
  → [Wait 4d] → [Email 5: Premium upsell]
```

**Setup:**
1. Add a webhook call in your backend's register endpoint to trigger this workflow
2. Configure SMTP credentials in n8n
3. Customize email templates for your branding

---

## 2. Re-engagement Campaign
**File:** `workflows/engagement/reengagement-campaign.json`

```
[Daily 8AM] → [MongoDB: Inactive users] → [Segment by days inactive]
  → 7 days:  "We miss you!"
  → 14 days: "Don't lose your streak!"
  → 30 days: "50% off premium offer"
  → 60 days: "Last chance + exit survey"
→ [Send emails] → [Log to Sheets] → [Weekly Telegram summary]
```

**MongoDB Query:**
```javascript
db.users.find({
  lastLogin: { $lt: new Date(Date.now() - 7*24*60*60*1000) },
  role: "user"
})
```

**Setup:**
1. Add MongoDB credentials in n8n
2. Customize email copy for each segment
3. Set up Google Sheets for tracking

---

## 3. Smart AI Newsletter
**File:** `workflows/engagement/smart-newsletter.json`

```
[Friday 2PM] → [Fetch top lessons] → [Fetch latest news]
  → [Fetch top contributor] → [Fetch platform stats]
  → [GPT-4o: Write newsletter in AR+FR]
  → [Generate HTML] → [Batch send to subscribers]
  → [Log results] → [Telegram report]
```

**Setup:**
1. Configure OpenAI credentials
2. Set up email sending (SendGrid/SMTP)
3. The AI writes bilingual content automatically

---

## 4. Subscription Upgrade Nudge
**File:** `workflows/engagement/subscription-upgrade-nudge.json`

```
[Daily 9AM] → [MongoDB: Free users hitting limits]
  → [AI: Personalized upgrade pitch] → [Send email]
  → [If near trial expiry: Urgency email]
  → [Track conversions in Sheets] → [Telegram report]
```

**Trigger conditions (customize):**
- User opened 10+ lessons
- User spent 5+ hours on platform
- User tried to access premium content
- User's trial expiring in 3 days

---

## 5. Milestone Celebrations
**File:** `workflows/engagement/milestone-celebrations.json`

```
[Hourly check] → [MongoDB: Check milestone hits]
  → [AI: Personalized congratulation]
  → [Send celebration email]
  → [If big milestone: Post as social proof]
  → [Telegram notify]
```

**Milestones tracked:**
| Milestone | Reward |
|-----------|--------|
| First lesson | Welcome badge |
| 10 lessons | 1 day premium |
| 50 lessons | 3 days premium |
| 100 lessons | 7 days premium |
| 7-day streak | Badge + notification |
| 30-day streak | 14 days premium |
| First contribution | Community badge |

---

## Required Credentials
- **MongoDB** - Direct database access
- **OpenAI API** - For AI-written content
- **SMTP/SendGrid** - Email sending
- **Google Sheets** - Tracking and logging
- **Telegram Bot** - Admin notifications

## Google Sheets Structure
Create a spreadsheet with these tabs:
- `Email_Log` - date, user, email_type, status
- `Conversions` - date, user, from_plan, to_plan, trigger
- `Milestones` - date, user, achievement, reward_given
