import { IamAuthenticator } from "ibm-cloud-sdk-core";
import { WatsonXAI } from "@ibm-cloud/watsonx-ai";

const apiKey = process.env.WATSONX_API_KEY;
const projectId = process.env.WATSONX_PROJECT_ID;
const serviceUrl = process.env.WATSONX_URL || "https://us-south.ml.cloud.ibm.com";

export async function generateWatsonxText(prompt: string) {
  if (!apiKey) {
    throw new Error("Missing WATSONX_API_KEY environment variable.");
  }

  if (!projectId) {
    throw new Error("Missing WATSONX_PROJECT_ID environment variable.");
  }

  const client = new WatsonXAI({
    version: "2024-05-31",
    serviceUrl,
    authenticator: new IamAuthenticator({ apikey: apiKey }),
  });

  const response = await client.generateText({
    modelId: "ibm/granite-4-h-small",
    projectId,
    input: prompt,
    parameters: {
      max_new_tokens: 100,
      min_new_tokens: 1,
      temperature: 0.2,
    },
  });

  return response.result.results?.[0]?.generated_text?.trim() || "No response returned.";
}
