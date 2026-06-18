require('dotenv').config();
const { App } = require('@slack/bolt');
const { createClient } = require('@supabase/supabase-js');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://example.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'example-anon-key'
);

app.command('/botdm', async ({ command, ack, client }) => {
  await ack();

  const userId = command.text.trim();

  if (!userId) {
    await client.chat.postEphemeral({
      channel: command.channel_id,
      user: command.user_id,
      text: 'Usage: /botdm <user-id>',
    });
    return;
  }

  const conversation = await client.conversations.open({
    users: userId,
  });

  await client.chat.postMessage({
    channel: conversation.channel.id,
    text: `Hi <@${userId}>, this is a test DM from the bot. Requested by <@${command.user_id}>.`,
  });

  await supabase.from('dm_logs').insert({
    requested_by: command.user_id,
    sent_to: userId,
    message: 'This is a test DM from the bot.',
  });
});

(async () => {
  await app.start();
  console.log('Slack bot is running');
})();
