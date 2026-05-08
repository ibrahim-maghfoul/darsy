# Growth & Analytics Workflows - Documentation

## Overview
6 workflows for data-driven growth hacking, from analytics to viral loops.

---

## 1. Weekly Growth Dashboard
**File:** `workflows/analytics/weekly-growth-dashboard.json`

```
[Sunday 8PM] → Parallel fetch:
  ├── [MongoDB: Users stats (total, new, DAU/WAU/MAU)]
  ├── [MongoDB: Subscription conversions]
  ├── [MongoDB: Top 10 lessons by views]
  ├── [MongoDB: Contributions + teachers + instructors]
  ├── [Google Analytics: Traffic, sources, bounce rate]
  └── [Social APIs: Followers, engagement rates]
→ [Merge all] → [GPT-4o: Executive summary + insights]
→ [Generate HTML report] → [Save to Drive]
→ [Send summary to Telegram] → [Archive to Sheets]
```

**Key metrics tracked:**
- User growth (daily, weekly, monthly)
- Subscription conversion rates
- Content engagement (lessons viewed, time spent)
- Social media growth
- Revenue trends

---

## 2. AI Churn Predictor
**File:** `workflows/analytics/churn-predictor.json`

```
[Daily 6AM] → [MongoDB: All active users + activity]
  → [Code: Calculate engagement score per user]
  → [AI: Identify churn risk patterns]
  → [Segment: High / Medium / Low risk]
    ├── High → [Immediate: Personal email + special offer]
    ├── Medium → [Add to re-engagement queue]
    └── Low → [Monitor]
  → [Save predictions to Sheets]
  → [Daily churn summary to Telegram]
```

**Engagement Score Algorithm:**
```javascript
score = (
  loginFrequency * 0.3 +     // How often they log in
  lessonsViewed * 0.25 +      // Content consumption
  timeSpent * 0.2 +           // Time on platform
  recency * 0.15 +            // How recently active
  socialActivity * 0.1         // Chat, contributions
) / 5;

// High risk: score < 0.3
// Medium risk: score 0.3 - 0.6
// Low risk: score > 0.6
```

---

## 3. A/B Test Content
**File:** `workflows/analytics/ab-test-content.json`

```
[Manual trigger] → [Read test brief from Sheets]
  → [AI: Generate Variation A + B]
  → [DALL-E: Image for each] (parallel)
  → [Send both to Telegram for preview]
  → [Log to Sheets]
```

**How to use:**
1. Add a row to the "AB_Tests" sheet: `idea | platform | goal`
2. Run the workflow manually
3. Review variations in Telegram
4. Post both, wait 24h, compare metrics
5. Log winner in Sheets

---

## 4. Referral Program
**File:** `workflows/growth/referral-program.json`

```
[Webhook: Referral signup] → [Find referrer by code]
  → [Check milestones: 5/10/25/50/100]
  → [Increment referral count]
  → [Email referrer: "Someone joined!"]
  → [Email new user: "Welcome bonus!"]
  → [If milestone: Grant premium days + alert Telegram]
  → [Log to Sheets]
```

**Reward Tiers:**
| Referrals | Premium Days | Badge |
|-----------|-------------|-------|
| 5 | 7 days | Starter Referrer |
| 10 | 14 days | Active Referrer |
| 25 | 30 days | Super Referrer |
| 50 | 60 days | Elite Referrer |
| 100 | 365 days | Legend Referrer |

**Backend integration:** Add to your register endpoint:
```javascript
// After successful registration
if (user.affiliateCodeUsed) {
  await fetch('http://localhost:5678/webhook/referral-signup', {
    method: 'POST',
    body: JSON.stringify({
      newUserId: user._id,
      referralCode: user.affiliateCodeUsed,
      email: user.email,
      name: user.displayName
    })
  });
}
```

---

## 5. Viral Loop Engine
**File:** `workflows/growth/viral-loop-engine.json`

```
[Webhook: User achievement] → [Classify: Is it share-worthy?]
  → [AI: Generate achievement card + share text]
  → [DALL-E: Achievement card image]
  → [Email user: "Share your achievement!"]
    (includes WhatsApp, Twitter, Facebook share links)
  → [Log to Sheets]
```

**Achievements that trigger sharing:**
- First lesson completed
- 10/50/100 lessons
- 7-day/30-day streaks
- First contribution
- Top contributor of the week
- Exam passed

**Backend integration:** Add to your progress controller:
```javascript
// After marking lesson complete
if (completedCount === 1 || completedCount === 10 || ...) {
  await fetch('http://localhost:5678/webhook/user-achievement', {
    method: 'POST',
    body: JSON.stringify({
      userId: user._id,
      achievementType: 'lesson_10',
      data: { userName: user.displayName, email: user.email, stats: { completed: 10 } }
    })
  });
}
```

---

## 6. Lead Magnet Funnel
**File:** `workflows/growth/lead-magnet-funnel.json`

```
[Webhook: Lead captured] → [Save to Sheets]
  → [Email 1: Deliver resource] (immediate)
  → [Wait 1 day] → [Email 2: "How was it? Here's more"]
  → [Wait 3 days] → [Email 3: Social proof & testimonials]
  → [Wait 5 days] → [Check: Did they sign up?]
    ├── Yes → [Move to welcome sequence] → [Telegram: converted!]
    └── No → [Email 4: 50% off final offer] → [Telegram: not converted]
```

**Lead magnet ideas:**
- Free BAC exam prep guide (PDF)
- "Top 10 study techniques" ebook
- Free lesson pack (3 premium lessons)
- Study schedule template
- Past exam papers collection

---

## Required Credentials
- **MongoDB** - User data and analytics
- **OpenAI API** - AI analysis and content
- **Google Sheets** - Tracking and logging
- **Google Drive** - Report storage
- **Google Analytics** - Traffic data (optional)
- **Telegram Bot** - Notifications
- **SMTP/SendGrid** - Email sending

## Google Sheets Tabs Needed
- `Growth_Weekly` - Weekly snapshots
- `Churn_Predictions` - Daily risk scores
- `AB_Tests` / `AB_Results` - Test management
- `Referrals` - Referral tracking
- `Achievements` - Achievement log
- `Leads` - Lead funnel tracking
