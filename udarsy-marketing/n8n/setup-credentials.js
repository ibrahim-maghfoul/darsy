/**
 * Udarsy N8N - Credential ID Patcher
 * Run this AFTER you create your credentials in n8n.
 *
 * 1. Create each credential in n8n (see guide below)
 * 2. Copy the credential ID from n8n for each one
 * 3. Paste the IDs in the CONFIG section below
 * 4. Run: node setup-credentials.js
 * 5. Import all workflow JSON files into n8n
 */

// ============================================================
//  STEP 1: Fill in your real credential IDs from n8n
//  (Get these from: n8n → Credentials → click credential → copy ID from URL)
// ============================================================
const CONFIG = {
  // Already set (your Telegram marketing bot)
  TELEGRAM_CREDENTIAL_ID: 'XKvv8ek8iXO8xWJT',

  // Your support bot (if different from marketing bot — else use same ID)
  TELEGRAM_SUPPORT_BOT_CREDENTIAL_ID: 'XKvv8ek8iXO8xWJT',

  // OpenAI: n8n → Credentials → New → OpenAI API → paste sk-proj-... key
  OPENAI_CREDENTIAL_ID: 'REPLACE_ME',

  // Google Sheets: n8n → Credentials → New → Google Sheets OAuth2 → authorize
  GOOGLE_SHEETS_CREDENTIAL_ID: 'REPLACE_ME',
  GSHEET_CREDENTIAL_ID: 'REPLACE_ME',       // same ID as above

  // Google Drive: n8n → Credentials → New → Google Drive OAuth2 → authorize
  GOOGLE_DRIVE_CREDENTIAL_ID: 'REPLACE_ME',
  GDRIVE_CREDENTIAL_ID: 'REPLACE_ME',        // same ID as above

  // Google Analytics (optional — only needed for SEO monitor)
  GA_OAUTH_CREDENTIAL_ID: 'REPLACE_ME',

  // MongoDB: n8n → Credentials → New → MongoDB → connection string
  MONGODB_CREDENTIAL_ID: 'REPLACE_ME',
  MONGO_CREDENTIAL_ID: 'REPLACE_ME',         // same ID as above

  // Email / SMTP: n8n → Credentials → New → SMTP → SendGrid or Gmail settings
  SMTP_CREDENTIAL_ID: 'REPLACE_ME',
};

// ============================================================
//  Auto-patcher — no need to edit below this line
// ============================================================
const fs = require('fs');
const path = require('path');

let totalReplaced = 0;
let filesChanged = 0;

function scanDir(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) results = results.concat(scanDir(full));
    else if (f.endsWith('.json')) results.push(full);
  }
  return results;
}

const workflowDir = path.join(__dirname, 'workflows');
const files = scanDir(workflowDir);

// Check for un-replaced values
const missing = Object.entries(CONFIG)
  .filter(([k, v]) => v === 'REPLACE_ME')
  .map(([k]) => k);

if (missing.length > 0) {
  console.log('\n⚠️  WARNING: These credential IDs are still set to REPLACE_ME:');
  missing.forEach(m => console.log('   -', m));
  console.log('\nWorkflows using these credentials will still have placeholder IDs.');
  console.log('Set them up in n8n and re-run this script when ready.\n');
}

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  let replacedInFile = 0;

  for (const [placeholder, realId] of Object.entries(CONFIG)) {
    if (realId === 'REPLACE_ME') continue;
    const regex = new RegExp(placeholder, 'g');
    const matches = content.match(regex);
    if (matches) {
      content = content.replace(regex, realId);
      replacedInFile += matches.length;
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content);
    const name = path.relative(workflowDir, file);
    console.log(`✅ ${name} — ${replacedInFile} replacement(s)`);
    totalReplaced += replacedInFile;
    filesChanged++;
  }
}

console.log(`\nDone! ${totalReplaced} total replacements across ${filesChanged} files.`);
if (missing.length === 0) {
  console.log('All credentials patched. You can now import all workflow files into n8n.');
} else {
  console.log(`${missing.length} credential type(s) still pending. Re-run after setting them up.`);
}
