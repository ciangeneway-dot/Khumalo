import type { AzureFunction, Context, HttpRequest } from "@azure/functions";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2025-04-01-preview";

  if (!endpoint || !apiKey || !deployment) {
    context.res = {
      status: 500,
      body: { error: "Azure OpenAI environment variables are not configured." }
    };
    return;
  }

  try {
    const body = req.body || {};
    const messages = body.messages;
    const maxTokens = body.max_completion_tokens ?? 1500;

    if (!Array.isArray(messages) || messages.length === 0) {
      context.res = { status: 400, body: { error: "Missing messages array" } };
      return;
    }

    const response = await fetch(`${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey
      },
      body: JSON.stringify({ messages, max_completion_tokens: maxTokens })
    });

    const data = await response.json();
    if (!response.ok) {
      context.res = { status: response.status, body: data };
      return;
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: data
    };
  } catch (err: any) {
    context.log("Azure OpenAI proxy error", err);
    context.res = { status: 500, body: { error: "Proxy failed", detail: String(err?.message || err) } };
  }
};

export default httpTrigger;


