// in backend/auth/auth.ts

// 1. Make sure 'cors' is included in this import
import { api, APIError, Gateway, Header, Cookie, cors } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { authDB } from "./db";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

// --- All of your interfaces can stay here ---
export interface AuthParams { /* ... */ }
export interface AuthData { /* ... */ }
export interface SignupRequest { email: string; password: string; }
export interface LoginRequest { email: string; password: string; }
export interface AuthResponse { token: string; user: { id: string; email: string; }; session?: Cookie<"session">; }
export interface LogoutResponse { session: Cookie<"session">; }

// --- Your existing authHandler, gw, signup, login, and logout functions are fine ---
// ... (keep them as they are) ...

// Creates a new user account.
export const signup = api<SignupRequest, AuthResponse>(
  // ... your existing signup code
);

// Logs in an existing user for the web app.
export const login = api<LoginRequest, AuthResponse>(
  // ... your existing login code
);

// --- THIS IS THE CORRECTED getToken FUNCTION ---
// 2. Add the 'cors' block and adjust the response type
export const getToken = api<LoginRequest, AuthResponse>(
  {
    expose: true,
    method: "POST",
    path: "/auth/get-token",
    // THIS IS THE CRUCIAL PART THAT WAS MISSING
    cors: {
      allowOrigins: ["chrome-extension://*"],
      allowMethods: ["POST"],
      allowHeaders: ["Content-Type"],
    },
  },
  async (req) => {
    const user = await authDB.queryRow`
      SELECT id, email, password_hash FROM users WHERE email = ${req.email}
    `;
    
    if (!user) { throw APIError.unauthenticated("invalid credentials"); }

    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) { throw APIError.unauthenticated("invalid credentials"); }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: "7d" });

    // Note: We use AuthResponse here as it already has the correct shape.
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
  // ... your existing logout code
);