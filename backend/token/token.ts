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

// This is the final, correct version of the getToken endpoint.
export const getToken = api<LoginRequest, AuthResponse>(
  {
    expose: true,
    method: "POST",
    path: "/auth/get-token",
    // We have completely removed the 'cors' property.
  },
  async (req) => {
    const user = await authDB.queryRow`
      SELECT id, email, password_hash FROM users WHERE email = ${req.email}
    `;
    
    if (!user) { throw APIError.unauthenticated("invalid credentials"); }

    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) { throw APIError.unauthenticated("invalid credentials"); }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: "7d" });

    // We manually construct the response to include the CORS header.
    return {
      status: 200,
      headers: {
        // This is the header that tells the browser it's okay for the extension to see the response.
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

