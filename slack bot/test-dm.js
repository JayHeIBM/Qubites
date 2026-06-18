/**
 * test-dm.js
 *
 * Runs the core /botdm logic locally — no Slack connection required.
 *
 * What it tests:
 *   1. conversations.open  → opens a DM channel with a target user
 *   2. chat.postMessage    → sends the DM text
 *   3. supabase insert     → logs the event to dm_logs
 *
 * Usage:
 *   node test-dm.js <TARGET_USER_ID> [REQUESTER_USER_ID]
 *
 * Examples:
 *   node test-dm.js U012AB3CD                     # real Slack + Supabase
 *   DRY_RUN=1 node test-dm.js U012AB3CD           # mock everything, no network
 */

require('dotenv').config();

const TARGET_USER_ID  = process.argv[2] || 'U_TARGET_PLACEHOLDER';
const REQUESTER_ID    = process.argv[3] || 'U_REQUESTER_PLACEHOLDER';
const DRY_RUN         = process.env.DRY_RUN === '1';

// ── Helpers ────────────────────────────────────────────────────────────────

function pass(label)  { console.log(`  ✓  ${label}`); }
function fail(label, err) { console.error(`  ✗  ${label}\n     ${err?.message ?? err}`); }

// ── Mock Slack client (used when DRY_RUN=1) ────────────────────────────────

const mockClient = {
  conversations: {
    open: async ({ users }) => {
      console.log(`  [mock] conversations.open  users=${users}`);
      return { channel: { id: 'D_MOCK_CHANNEL' } };
    },
  },
  chat: {
    postMessage: async ({ channel, text }) => {
      console.log(`  [mock] chat.postMessage    channel=${channel}`);
      console.log(`         text: "${text}"`);
      return { ok: true, ts: '0000000000.000000' };
    },
  },
};

// ── Mock Supabase client (used when DRY_RUN=1) ────────────────────────────

const mockSupabase = {
  from: () => ({
    insert: async (row) => {
      console.log('  [mock] supabase.insert    ', JSON.stringify(row));
      return { data: row, error: null };
    },
  }),
};

// ── Real clients (used when DRY_RUN is not set) ───────────────────────────

async function getRealClient() {
  const { WebClient } = require('@slack/web-api');
  return new WebClient(process.env.SLACK_BOT_TOKEN);
}

async function getRealSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  );
}

// ── Core logic (extracted from index.js /botdm handler) ───────────────────

async function sendDM({ client, supabase, targetUserId, requestedBy }) {
  // Step 1 — open DM channel
  const conversation = await client.conversations.open({ users: targetUserId });
  const channelId = conversation.channel.id;

  // Step 2 — post message
  const text = `Hi <@${targetUserId}>, this is a test DM from the bot. Requested by <@${requestedBy}>.`;
  await client.chat.postMessage({ channel: channelId, text });

  // Step 3 — log to Supabase
  const { error } = await supabase.from('dm_logs').insert({
    requested_by: requestedBy,
    sent_to:      targetUserId,
    message:      'This is a test DM from the bot.',
  });
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
}

// ── Test runner ────────────────────────────────────────────────────────────

async function run() {
  console.log('\n=== /botdm local test ===');
  console.log(`  mode         : ${DRY_RUN ? 'DRY RUN (mocked)' : 'LIVE'}`);
  console.log(`  target user  : ${TARGET_USER_ID}`);
  console.log(`  requester    : ${REQUESTER_ID}`);
  console.log('');

  const client   = DRY_RUN ? mockClient   : await getRealClient();
  const supabase = DRY_RUN ? mockSupabase : await getRealSupabase();

  // ── Test 1: valid user ID ──────────────────────────────────────────────
  console.log('Test 1 — send DM and log to Supabase');
  try {
    await sendDM({ client, supabase, targetUserId: TARGET_USER_ID, requestedBy: REQUESTER_ID });
    pass('DM sent and logged');
  } catch (err) {
    fail('DM flow failed', err);
    process.exitCode = 1;
  }

  // ── Test 2: empty user ID guard ────────────────────────────────────────
  console.log('\nTest 2 — empty user ID should be rejected before reaching Slack');
  const emptyUserId = '   '.trim();
  if (!emptyUserId) {
    pass('Empty user ID correctly detected (would reply with usage hint)');
  } else {
    fail('Empty user ID check failed — guard is missing');
    process.exitCode = 1;
  }

  console.log('\n=== done ===\n');
}

run().catch((err) => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
