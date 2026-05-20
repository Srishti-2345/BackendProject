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

const getModelCandidates = () =>
  [
    process.env.OPENROUTER_MODEL,
    process.env.FREE_AI_MODEL,
    process.env.FREE_MODEL_NAME,
    DEFAULT_FREE_MODEL,
  ]
    .flatMap((value) => String(value || "").split(","))
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);

const extractJsonText = (value = "") => {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return trimmed;
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  const firstBracket = trimmed.indexOf("[");
  const lastBracket = trimmed.lastIndexOf("]");
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    return trimmed.slice(firstBracket, lastBracket + 1);
  }

  return trimmed;
};

const parseJsonOutput = (outputText, schemaName) => {
  const jsonText = extractJsonText(outputText);

  try {
    return JSON.parse(jsonText);
  } catch (error) {
    const parseError = createAiServiceError(
      `Free model returned invalid JSON for ${schemaName}: ${error.message}`,
      502
    );
    parseError.schemaName = schemaName;
    throw parseError;
  }
};

const buildRequestBody = ({ model, systemPrompt, userPrompt, useStructuredJson = true }) => {
  const body = {
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
  };

  if (useStructuredJson) {
    body.response_format = {
      type: "json_object",
    };
    body.plugins = [{ id: "response-healing" }];
  }

  return body;
};

export const callFreeModelJson = async ({ systemPrompt, userPrompt, schemaName }) => {
  const { apiKey } = getFreeModelSettings();
  const modelCandidates = getModelCandidates();

  if (!apiKey) {
    throw createAiServiceError(
      "OPENROUTER_API_KEY or FREE_MODEL_API_KEY is missing",
      500
    );
  }

  let lastError = null;

  for (const model of modelCandidates) {
    for (const useStructuredJson of [true, false]) {
    try {
      const response = await fetch(OPENROUTER_CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(
          buildRequestBody({
            model,
            systemPrompt,
            userPrompt,
            useStructuredJson,
          })
        ),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = createAiServiceError(
          `Free model request failed for ${schemaName} using ${model}${useStructuredJson ? " with structured JSON" : " with plain JSON prompting"}: ${response.status} ${errorText}`,
          response.status === 401 || response.status === 429 ? 502 : response.status
        );
        error.upstreamStatus = response.status;
        error.schemaName = schemaName;
        lastError = error;
        continue;
      }

      const responseData = await response.json();
      const outputText = getMessageText(responseData?.choices?.[0]?.message?.content);

      if (!outputText) {
        const error = createAiServiceError(
          `Free model returned no structured output for ${schemaName} using ${model}`,
          502
        );
        error.schemaName = schemaName;
        lastError = error;
        continue;
      }

      return {
        model: responseData?.model || model,
        data: parseJsonOutput(outputText, schemaName),
      };
    } catch (error) {
      if (error.statusCode) {
        lastError = error;
        continue;
      }

      const networkError = createAiServiceError(
        `Free model request failed for ${schemaName} using ${model}: ${error.message}`,
        502
      );
      networkError.schemaName = schemaName;
      lastError = networkError;
    }
    }
  }

  throw lastError || createAiServiceError(`Free model request failed for ${schemaName}`, 502);
};
