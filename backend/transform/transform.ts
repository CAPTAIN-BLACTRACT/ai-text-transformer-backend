import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const authDB = SQLDatabase.named("auth");

export interface TransformRequest {
  selectedText: string;
  command: string;
}

export interface TransformResponse {
  transformedText: string;
}

const COMMAND_PROMPTS = {
  summarize: (text: string) => `Summarize the following text into a concise paragraph: ${text}`,
  improve_writing: (text: string) => `You are an expert editor. Rewrite the following text to be more clear, concise, and professional. Fix all spelling and grammar errors. Do not change the core meaning. Text: ${text}`,
  make_shorter: (text: string) => `Distill the following text to its core message, making it significantly shorter: ${text}`,
  tone_professional: (text: string) => `Rewrite the following text in a formal, professional, and confident tone: ${text}`,
};

// Transforms selected text using AI based on the specified command.
export const transform = api<TransformRequest, TransformResponse>(
  { auth: true, expose: true, method: "POST", path: "/api/transform" },
  async (req) => {
    const auth = getAuthData()!;
    
    // Get user's LLM API key
    const user = await authDB.queryRow`
      SELECT llm_api_key FROM users WHERE id = ${auth.userID}
    `;
    
    if (!user || !user.llm_api_key) {
      throw APIError.failedPrecondition("LLM API key not configured. Please set your API key in settings.");
    }

    // Validate command
    if (!(req.command in COMMAND_PROMPTS)) {
      throw APIError.invalidArgument("Invalid command. Supported commands: summarize, improve_writing, make_shorter, tone_professional");
    }

    // Construct prompt
    const promptGenerator = COMMAND_PROMPTS[req.command as keyof typeof COMMAND_PROMPTS];
    const prompt = promptGenerator(req.selectedText);

    try {
      // Call OpenAI API
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.llm_api_key}`,
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} ${errorData}`);
      }

      const data = await response.json();
      const transformedText = data.choices[0]?.message?.content;

      if (!transformedText) {
        throw new Error("No response from OpenAI API");
      }

      // Store transformation in database
      await authDB.exec`
        INSERT INTO transformations (user_id, command, selected_text, transformed_text)
        VALUES (${auth.userID}, ${req.command}, ${req.selectedText}, ${transformedText})
      `;

      return {
        transformedText,
      };
    } catch (error) {
      throw APIError.internal("Failed to process transformation", error);
    }
  }
);
