# Firebase Deduplication Script ✓ COMPLETED

## Purpose
This script removes duplicate subjects from Firebase Firestore that were causing the admin panel to display duplicate subjects.

## Results

**Successfully executed:**
- **Removed**: 77 duplicate subjects (375 → 298)
- **Updated**: 675 lessons to reference correct subject IDs
- **Final count**: 298 unique subjects (matching MongoDB)

## Prerequisites (Already Done)

### 1. Install Firebase Admin SDK
```bash
npm install firebase-admin
```

### 2. Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`darsy-3f275`)
3. Click the gear icon ⚙️ → **Project Settings**
4. Navigate to **Service Accounts** tab
5. Click **Generate New Private Key**
6. Save the downloaded JSON file as `serviceAccountKey.json` in this directory (`darsy-admin/`)

> **⚠️ IMPORTANT**: The `serviceAccountKey.json` file contains sensitive credentials. Never commit it to version control!

## What This Script Does

1. **Fetches all subjects** from Firebase Firestore
2. **Identifies duplicates** based on `guidanceId` + `title`  
3. **Updates lessons** to reference the primary (non-duplicate) subject ID
4. **Updates exams** to reference the primary (non-duplicate) subject ID
5. **Deletes duplicate** subject documents from Firestore

## How to Run (Already Executed)

```bash
cd darsy-admin
node deduplicate_firebase.cjs
```

## Expected Output

```
--- STARTING FIREBASE DEDUPLICATION ---
Fetching subjects from Firebase...
- Total subjects in Firebase: XXX
- Unique subjects: 298
- Duplicates to remove: XX
Updating lesson references...
- Updated XX lessons
Updating exam references...
- Updated XX exams
Deleting duplicate subjects...
- Deleted XX duplicate subjects
--- FIREBASE DEDUPLICATION COMPLETE ---
Final subject count: 298
```

## After Running

1. **Verify** in Firebase Console that subjects collection has 298 documents
2. **Test admin panel** to ensure no duplicates appear
3. **Do NOT run MongoSync** until Firebase is clean (it will push duplicates to MongoDB)

## Troubleshooting

### Error: Cannot find module 'firebase-admin'
Run: `npm install firebase-admin`

### Error: Service account object must contain a string "project_id" property
Make sure `serviceAccountKey.json` is in the correct location and is valid

### Error: Permission denied
Ensure your Firebase service account has the correct permissions (Firestore Admin)
