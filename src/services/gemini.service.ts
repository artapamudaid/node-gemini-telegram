import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { normalizeAIResponse } from "../utils/aiResponse.util";

export async function askGemini(
  apiKey: string,
  prompt: string,
  payloads: any
): Promise<string> {
  const model = new ChatGoogleGenerativeAI({
    apiKey,
    model: "gemini-2.5-flash",
  });

  const result = await model.invoke([
    {
      role: "user",
      content: `
Prompt:
${prompt}

Payloads:
${JSON.stringify(payloads, null, 2)}
`,
    },
  ]);

  return normalizeAIResponse(result.content);
}
