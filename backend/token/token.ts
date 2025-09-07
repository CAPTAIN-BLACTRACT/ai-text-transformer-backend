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

// This is the final version of the getToken endpoint.
// It is now configured to handle both POST and OPTIONS requests.
export const getToken = api<LoginRequest, AuthResponse>(
  {
    expose: true,
    method: "POST, OPTIONS", // We now accept both methods
    path: "/token/token", 
  },
  async (req) => {
    // --- THIS IS THE CORS PREFLIGHT HANDLER ---
    // If the browser is asking for permission, we grant it and end the request.
    if (req.method === "OPTIONS") {
      return {
        status: 204, // No Content - the standard for a successful preflight
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      };
    }
    // --- END OF PREFLIGHT HANDLER ---

    // If it's a POST request, we proceed with the login logic as before.
    const user = await authDB.queryRow`
      SELECT id, email, password_hash FROM users WHERE email = ${req.email}
    `;
    
    if (!user) { throw APIError.unauthenticated("invalid credentials"); }

    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) { throw APIError.unauthenticated("invalid credentials"); }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: "7d" });

    return {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
      body: {
        token,
        user: {
          id: user.id.toString(),
          email: user.email,
        },
      },
    };
  }
);

