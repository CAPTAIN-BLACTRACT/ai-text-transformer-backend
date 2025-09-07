import { api, APIError } from "encore.dev/api";
import { authDB } from "../auth/db";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
  };
}

// This is the final version. It handles both POST and the invisible OPTIONS request.
export const getToken = api<LoginRequest, AuthResponse>(
  {
    expose: true,
    method: "POST, OPTIONS", // We now accept both methods
    path: "/token",          // This path will be prefixed by the service name to become /token/token
  },
  async (req) => {
    // --- CORS PREFLIGHT HANDLER ---
    // If the browser is sending the preliminary OPTIONS request, we give it permission.
    if (req.method === "OPTIONS") {
      return {
        status: 204, // "No Content" is the standard successful response for a preflight
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      };
    }
    // --- END OF PREFLIGHT HANDLER ---

    // If it's a POST request, we proceed with the actual login logic.
    const user = await authDB.queryRow`
      SELECT id, email, password_hash FROM users WHERE email = ${req.email}
    `;
    
    if (!user) { throw APIError.unauthenticated("invalid credentials"); }

    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) { throw APIError.unauthenticated("invalid credentials"); }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: "7d" });

    // We manually add the CORS header to the final response as well.
    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: {
        token,
        user: {
          id: user.toString(),
          email: user.email,
        },
      },
    };
  }
);

