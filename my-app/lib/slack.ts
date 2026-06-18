const slackBotToken = process.env.SLACK_BOT_TOKEN;

if (!slackBotToken) {
  throw new Error("Missing SLACK_BOT_TOKEN environment variable.");
}

type SlackOpenConversationResponse = {
  ok: boolean;
  error?: string;
  channel?: {
    id: string;
  };
};

type SlackPostMessageResponse = {
  ok: boolean;
  error?: string;
};

async function slackApiRequest<T>(endpoint: string, body: Record<string, unknown>) {
  const response = await fetch(`https://slack.com/api/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${slackBotToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { ok?: boolean; error?: string };

  if (!response.ok || !payload.ok) {
    throw new Error(payload.error ?? `Slack API request failed for ${endpoint}.`);
  }

  return payload;
}

export async function sendSlackDirectMessage(slackUserId: string, text: string) {
  const conversation = await slackApiRequest<SlackOpenConversationResponse>(
    "conversations.open",
    {
      users: slackUserId,
    }
  );

  if (!conversation.channel?.id) {
    throw new Error("Slack did not return a DM channel.");
  }

  await slackApiRequest<SlackPostMessageResponse>("chat.postMessage", {
    channel: conversation.channel.id,
    text,
  });
}
