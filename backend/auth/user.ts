import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { authDB } from "./db";

export interface User {
  id: string;
  email: string;
  hasLLMKey: boolean;
}

export interface UpdateLLMKeyRequest {
  llmApiKey: string;
}

export interface UserStats {
  totalTransformations: number;
  recentTransformations: Array<{
    id: string;
    command: string;
    selectedText: string;
    transformedText: string;
    createdAt: Date;
  }>;
}

// Gets the current user's profile.
export const getProfile = api<void, User>(
  { auth: true, expose: true, method: "GET", path: "/auth/profile" },
  async () => {
    const auth = getAuthData()!;
    
    const user = await authDB.queryRow`
      SELECT id, email, llm_api_key FROM users WHERE id = ${auth.userID}
    `;
    
    if (!user) {
      throw APIError.notFound("user not found");
    }

    return {
      id: user.id.toString(),
      email: user.email,
      hasLLMKey: !!user.llm_api_key,
    };
  }
);

// Updates the current user's LLM API key.
export const updateLLMKey = api<UpdateLLMKeyRequest, void>(
  { auth: true, expose: true, method: "PUT", path: "/auth/llm-key" },
  async (req) => {
    const auth = getAuthData()!;
    
    await authDB.exec`
      UPDATE users 
      SET llm_api_key = ${req.llmApiKey}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${auth.userID}
    `;
  }
);

// Gets user stats and recent transformations.
export const getStats = api<void, UserStats>(
  { auth: true, expose: true, method: "GET", path: "/auth/stats" },
  async () => {
    const auth = getAuthData()!;
    
    const totalResult = await authDB.queryRow`
      SELECT COUNT(*) as count FROM transformations WHERE user_id = ${auth.userID}
    `;
    
    const recentTransformations = await authDB.queryAll`
      SELECT id, command, selected_text, transformed_text, created_at
      FROM transformations 
      WHERE user_id = ${auth.userID}
      ORDER BY created_at DESC
      LIMIT 5
    `;

    return {
      totalTransformations: parseInt(totalResult?.count || "0"),
      recentTransformations: recentTransformations.map(t => ({
        id: t.id.toString(),
        command: t.command,
        selectedText: t.selected_text,
        transformedText: t.transformed_text,
        createdAt: new Date(t.created_at),
      })),
    };
  }
);
