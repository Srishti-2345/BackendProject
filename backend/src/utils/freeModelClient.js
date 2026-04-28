const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_FREE_MODEL = "openrouter/free";

const createAiServiceError = (message, statusCode = 502) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getMessageText = (content) => {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") {
          return part;
        }

        if (part?.type === "text" && typeof part.text === "string") {
          return part.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
};

export const getFreeModelSettings = () => ({
  apiKey: process.env.OPENROUTER_API_KEY || process.env.FREE_MODEL_API_KEY || "",
  model:
    process.env.OPENROUTER_MODEL ||
    process.env.FREE_AI_MODEL ||
    process.env.FREE_MODEL_NAME ||
    DEFAULT_FREE_MODEL,
  fallbackEnabled:
    process.env.OPENROUTER_ALLOW_FALLBACK === "true" ||
    process.env.FREE_MODEL_ALLOW_FALLBACK === "true" ||
    process.env.OPENAI_ALLOW_FALLBACK === "true",
});

export const callFreeModelJson = async ({ systemPrompt, userPrompt, schemaName }) => {
  const { apiKey, model } = getFreeModelSettings();

  if (!apiKey) {
    throw createAiServiceError(
      "OPENROUTER_API_KEY or FREE_MODEL_API_KEY is missing",
      500
    );
  }

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `${systemPrompt}\nReturn strict JSON only. Do not use markdown fences.`,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      response_format: {
        type: "json_object",
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = createAiServiceError(
      `Free model request failed for ${schemaName}: ${response.status} ${errorText}`,
      response.status === 401 || response.status === 429 ? 502 : response.status
    );
    error.upstreamStatus = response.status;
    error.schemaName = schemaName;
    throw error;
  }

  const responseData = await response.json();
  const outputText = getMessageText(responseData?.choices?.[0]?.message?.content);

  if (!outputText) {
    throw new Error(`Free model returned no structured output for ${schemaName}`);
  }

  return {
    model: responseData?.model || model,
    data: JSON.parse(outputText),
  };
};
