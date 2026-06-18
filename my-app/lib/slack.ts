const slackBotToken = process.env.SLACK_BOT_TOKEN;

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
  console.log("[Slack] Request start", {
    endpoint,
    body,
  });

  if (!slackBotToken) {
    throw new Error("Missing SLACK_BOT_TOKEN environment variable.");
  }

  const response = await fetch(`https://slack.com/api/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${slackBotToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const payload = (await response.json()) as T & { ok?: boolean; error?: string };

  console.log("[Slack] Response received", {
    endpoint,
    status: response.status,
    ok: payload.ok,
    error: payload.error,
    payload,
  });

  if (!response.ok || !payload.ok) {
    console.error("[Slack] Request failed", {
      endpoint,
      status: response.status,
      body,
      payload,
    });
    throw new Error(payload.error ?? `Slack API request failed for ${endpoint}.`);
  }

  return payload;
}

export async function sendSlackDirectMessage(slackUserId: string, text: string) {
  console.log("[Slack] sendSlackDirectMessage called", {
    slackUserId,
    text,
  });

  const conversation = await slackApiRequest<SlackOpenConversationResponse>(
    "conversations.open",
    {
      users: slackUserId,
    }
  );

  if (!conversation.channel?.id) {
    console.error("[Slack] Missing DM channel in conversations.open response", {
      slackUserId,
      conversation,
    });
    throw new Error("Slack did not return a DM channel.");
  }

  console.log("[Slack] DM channel opened", {
    slackUserId,
    channelId: conversation.channel.id,
  });

  await slackApiRequest<SlackPostMessageResponse>("chat.postMessage", {
    channel: conversation.channel.id,
    text,
  });

  console.log("[Slack] DM sent successfully", {
    slackUserId,
    channelId: conversation.channel.id,
  });
}
