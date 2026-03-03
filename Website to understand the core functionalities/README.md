# DarsySchool Web

A modern, responsive web application for DarsySchool, built with Next.js 14, Tailwind CSS, and Firebase.

## Features

- **Modern UI/UX**: Glassmorphism design, dark mode support, and smooth animations using Framer Motion.
- **Explore & Study**: Browse Schools, Levels, Guidances, Subjects, and Lessons.
- **Lesson Viewer**: Integrated PDF viewer and resource tabs (Videos, Exercises, Exams).
- **User Progress**: Track learning time and daily goals.
- **Responsive**: Optimized for both mobile and desktop devices.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Configure Firebase**:
    - Open `src/lib/firebase.ts`.
    - Replace `YOUR_WEB_APP_ID` with your actual Firebase Web App ID (found in Firebase Console -> Project Settings).

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

- `src/app`: App Router pages and layouts.
- `src/components`: Reusable UI components.
  - `home`: Home screen components (Hero, News, etc.).
  - `layout`: Navbar, Sidebar, Footer.
  - `ui`: Generic UI elements.
- `src/lib`: Utilities and Firebase config.
- `src/services`: Data fetching logic.
- `src/types`: TypeScript interfaces.

## Deployment

To deploy to Vercel or similar platforms:

```bash
npm run build
```
