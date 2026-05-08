/**
 * Run this script once with: node add-webhook-triggers.js
 * It patches every workflow JSON to add:
 *   1. A Webhook Trigger node (so the Telegram bot can call it)
 *   2. A Get ChatId node (reads chatId from bot or falls back to default)
 *   3. Replaces YOUR_TELEGRAM_CHAT_ID with dynamic expression
 *   4. Rewires the first connection to go through Get ChatId
 */

const fs = require('fs');
const path = require('path');

const WORKFLOWS_DIR = path.join(__dirname, 'workflows');
const DEFAULT_CHAT_ID = 'YOUR_TELEGRAM_CHAT_ID'; // Replace with your actual chat ID

// Map: workflow filename → webhook path
const WEBHOOK_MAP = {
  'ai-content-calendar.json':         'run-content-calendar',
  'content-repurposing-engine.json':  'run-repurpose',
  'viral-hook-generator.json':        'run-viral-hooks',
  'competitor-spy.json':              'run-competitor-spy',
  'seo-keyword-monitor.json':         'run-seo-monitor',
  'influencer-outreach.json':         'run-influencer',
  'social-media-autopilot.json':      'run-social-autopilot',
  'ugc-collector.json':               'run-ugc',
  'seasonal-campaign-engine.json':    'run-seasonal',
  'review-reputation-manager.json':   'run-reputation',
  'personalized-recommendations.json':'run-recommendations',
  'smart-newsletter.json':            'run-newsletter',
  'reengagement-campaign.json':       'run-reengagement',
  'subscription-upgrade-nudge.json':  'run-upgrade-nudge',
  'milestone-celebrations.json':      'run-milestones',
  'weekly-growth-dashboard.json':     'run-growth-dashboard',
  'churn-predictor.json':             'run-churn',
  'ab-test-content.json':             'run-ab-test',
  'referral-program.json':            'run-referral-report',
  'lead-magnet-funnel.json':          'run-lead-funnel',
  'viral-loop-engine.json':           'run-viral-loop',
  'ai-social-media-manager.json':     'run-ai-social-manager',
};

function getAllJsonFiles(dir) {
  const results = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...getAllJsonFiles(fullPath));
    } else if (item.endsWith('.json')) {
      results.push(fullPath);
    }
  }
  return results;
}

function patchWorkflow(filePath) {
  const filename = path.basename(filePath);
  const webhookPath = WEBHOOK_MAP[filename];

  // Skip files not in our map or already patched
  if (!webhookPath) {
    console.log(`⏭️  Skipping (not in map): ${filename}`);
    return;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  let workflow;
  try {
    workflow = JSON.parse(raw);
  } catch (e) {
    console.log(`❌ JSON parse error: ${filename}`);
    return;
  }

  // Check if already patched
  const alreadyHasWebhook = workflow.nodes.some(n => n.id === 'webhook-trigger-bot');
  if (alreadyHasWebhook) {
    console.log(`✅ Already patched: ${filename}`);
    return;
  }

  // Find the first trigger node (schedule or manual)
  const firstTrigger = workflow.nodes.find(n =>
    n.type === 'n8n-nodes-base.scheduleTrigger' ||
    n.type === 'n8n-nodes-base.manualTrigger'
  );

  if (!firstTrigger) {
    console.log(`⚠️  No trigger found: ${filename}`);
    return;
  }

  const triggerPos = firstTrigger.position || [0, 0];

  // Add Webhook node
  const webhookNode = {
    parameters: {
      httpMethod: "POST",
      path: webhookPath,
      responseMode: "immediatelyAfterReceive",
      options: {}
    },
    id: "webhook-trigger-bot",
    name: "Webhook Trigger (from Bot)",
    type: "n8n-nodes-base.webhook",
    typeVersion: 2,
    position: [triggerPos[0], triggerPos[1] + 120],
    webhookId: webhookPath
  };

  // Add Get ChatId node
  const getChatIdNode = {
    parameters: {
      jsCode: `const fromWebhook = $input.first().json.body?.chatId;\nconst chatId = fromWebhook || '${DEFAULT_CHAT_ID}';\nreturn [{ json: { chatId } }];`
    },
    id: "get-chat-id-bot",
    name: "Get ChatId",
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    position: [triggerPos[0] + 240, triggerPos[1] + 60]
  };

  workflow.nodes.push(webhookNode);
  workflow.nodes.push(getChatIdNode);

  // Find what the original trigger connected to
  const originalTriggerName = firstTrigger.name;
  const originalConnections = workflow.connections[originalTriggerName];

  // Wire: original trigger → Get ChatId
  if (!workflow.connections[originalTriggerName]) {
    workflow.connections[originalTriggerName] = { main: [[]] };
  }
  // Keep original connection but also add Get ChatId
  workflow.connections[originalTriggerName] = {
    main: [[{ node: "Get ChatId", type: "main", index: 0 }]]
  };

  // Wire: Webhook → Get ChatId
  workflow.connections["Webhook Trigger (from Bot)"] = {
    main: [[{ node: "Get ChatId", type: "main", index: 0 }]]
  };

  // If Get ChatId isn't connected to anything, find the original first-connected node
  if (originalConnections?.main?.[0]?.[0]) {
    const originalFirstNode = originalConnections.main[0][0].node;
    workflow.connections["Get ChatId"] = {
      main: [[{ node: originalFirstNode, type: "main", index: 0 }]]
    };
  }

  // Replace hardcoded chat IDs in the JSON string
  let output = JSON.stringify(workflow, null, 2);
  output = output.replace(/YOUR_TELEGRAM_CHAT_ID/g, "={{ $('Get ChatId').first().json.chatId }}");

  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`✅ Patched: ${filename} → /webhook/${webhookPath}`);
}

// Run
console.log('🔧 Patching workflows with Telegram bot webhook triggers...\n');
const files = getAllJsonFiles(WORKFLOWS_DIR);
for (const file of files) {
  patchWorkflow(file);
}
console.log('\n🎉 Done! All workflows patched.');
console.log('\nNext steps:');
console.log('1. Replace YOUR_TELEGRAM_CHAT_ID in add-webhook-triggers.js with your actual chat ID');
console.log('2. Run: node add-webhook-triggers.js');
console.log('3. Import all workflow JSONs into n8n');
console.log('4. Import telegram-command-center.json');
console.log('5. Activate ALL workflows');
console.log('6. Message your bot: /start');
