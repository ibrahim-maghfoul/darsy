# Darsy Admin Panel — Functionality Overview

## Overview
The admin panel (`darsy-admin`) is the internal back-office for the Darsy team to manage content, users, marketing, and platform health.

---

## Sections

### 📊 Overview
- **Dashboard** — High-level KPIs: active users, enrollments, revenue, platform health.
- **Users** — Search, view, and manage all registered users. Ban, verify, or export.

### 📋 Applications
- **Instructor Apps** — Review and approve/reject instructor sign-up applications.
- **Teacher Verifications** — Verify teacher identity documents and credentials.
- **Courses Review** — Approve or reject course submissions before they go live.

### 📚 Content (Platform Curriculum)
- **Curriculum** — Manage lessons, subjects, and curriculum structure per grade.
- **News** — Publish announcements and news articles visible on the student portal.
- **Services** — Manage product/service listings displayed on the Darsy website.

### 🌐 Community
- **Chat Rooms** — Monitor and moderate student discussion channels.
- **Contributions** — Review and curate user-submitted study notes or materials.
- **Reports & Feedback** — View user-reported issues, bugs, and abuse reports.

### 🛠️ Tools
- **Batch Upload** — Bulk import data (users, courses, materials) via CSV or JSON.
- **Firebase View** — Browse and query the Firestore database directly.
- **Sync to Mongo** — Migrate or sync data between Firebase and MongoDB.
- **YouTube Tool** — Extract and convert YouTube educational video metadata.
- **Global Events** — Manage a shared academic calendar (exams, holidays, Darsy events).

---

## Content Creation Section

### 🖼️ Poster Generation
- Topic fetching from Morocco news/trends or manual input.
- AI-powered concept generation via Nebius (title, headline, design phrase).
- Image generation via Ghost API, DALL-E 2/3, or GPT-Image-1.
- Canvas compositing: DARSY text overlay + logo with configurable corners.
- Social media caption generation.
- Manual save to `public/data/content-sessions/` with full metadata JSON.

### 🚀 Launch Ideas
- 10 pre-seeded post ideas to introduce the Darsy platform.
- Checkbox-based bulk selection and batch generation.
- Per-idea poster + caption generation with save and download.

### 📁 Content Management
- CRUD on all saved poster sessions.
- AI caption generation per platform (Instagram / Facebook / TikTok).
- One-click publish interface per platform (real API integration pending).
- Image thumbnail grid with download support.

### 📈 Analytics
- Platform-filtered performance graphs (Instagram / Facebook / TikTok).
- Date range selectors: 7d / 30d / 90d.
- Key metrics: impressions, reach, engagement rate, new followers, posts published.
- Connected to saved sessions table for content traceability.

---

## Settings
- API key management and admin panel configurations (coming soon).
