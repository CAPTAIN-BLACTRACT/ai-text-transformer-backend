import { api, APIError, Gateway, Header, Cookie } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { authDB } from "./db";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

// --- INTERFACES ---
export interface AuthParams {
  authorization?: Header<"Authorization">;
}
export interface AuthData {
  userID: string;
  email: string;
}
export interface SignupRequest {
  email: string;
  password: string;
}
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
export interface LogoutResponse {
  session: Cookie<"session">;
}

// --- AUTH HANDLER & GATEWAY ---
const auth = authHandler<AuthParams, AuthData>(
  async (data) => {
    const token = data.authorization?.replace("Bearer ", "");
    if (!token) {
      throw APIError.unauthenticated("missing token");
    }
    try {
      const decoded = jwt.verify(token, jwtSecret()) as any;
      const user = await authDB.queryRow`
        SELECT id, email FROM users WHERE id = ${decoded.userId}
      `;
      if (!user) {
        throw APIError.unauthenticated("user not found");
      }
      return {
        userID: user.id.toString(),
        email: user.email,
      };
    } catch (err) {
      throw APIError.unauthenticated("invalid token", err);
    }
  }
);
export const gw = new Gateway({ authHandler: auth });

// --- API ENDPOINTS ---

// Creates a new user account.
export const signup = api<SignupRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/signup" },
  async (req) => {
    const existingUser = await authDB.queryRow`
      SELECT id FROM users WHERE email = ${req.email}
    `;
    if (existingUser) {
      throw APIError.alreadyExists("user already exists");
    }
    const passwordHash = await bcrypt.hash(req.password, 10);
    const user = await authDB.queryRow`
      INSERT INTO users (email, password_hash)
      VALUES (${req.email}, ${passwordHash})
      RETURNING id, email
    `;
    if (!user) {
      throw APIError.internal("failed to create user");
    }
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

// Logs in an existing user for the web app.
export const login = api<LoginRequest, AuthResponse>(
  { expose: true, method: "POST", path: "/auth/login" },
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

// Logs out the current user.
export const logout = api<void, LogoutResponse>(
  { expose: true, method: "POST", path: "/auth/logout" },
  async () => {
    return {
      session: {
        value: "",
        expires: new Date(0),
      },
    };
  }
);

