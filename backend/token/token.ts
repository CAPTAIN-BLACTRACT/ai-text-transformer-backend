import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const authDB = SQLDatabase.named("auth");
const jwtSecret = secret("JWTSecret");

// Define only the interfaces needed for this endpoint
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

// The getToken endpoint, now in its own isolated service
export const getToken = api<LoginRequest, AuthResponse>(
  {
    expose: true,
    method: "POST",
    path: "/auth/get-token",
  },
  async (req) => {
    const user = await authDB.queryRow`
      SELECT id, email, password_hash FROM users WHERE email = ${req.email}
    `;
    
    if (!user) { throw APIError.unauthenticated("invalid credentials"); }

    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) { throw APIError.unauthenticated("invalid credentials"); }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: "7d" });

    return {
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
      },
    };
  }
);
