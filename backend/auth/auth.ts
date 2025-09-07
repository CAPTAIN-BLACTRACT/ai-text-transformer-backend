import { api, APIError, Gateway, Header, Cookie } from "encore.dev/api";
import { authHandler } from "encore.dev/auth";
import { authDB } from "./db";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

export interface AuthParams {
  authorization?: Header<"Authorization">;
}
export interface AuthData {
  userID: string;
  email: string;
}
// ... other interfaces like SignupRequest, LoginRequest etc.

const auth = authHandler<AuthParams, AuthData>(
  // ... your existing authHandler logic is fine
);

export const gw = new Gateway({ authHandler: auth });

// ... your existing SignupRequest, LoginRequest, AuthResponse, LogoutResponse interfaces are fine

// Creates a new user account.
export const signup = api<SignupRequest, AuthResponse>(
  // ... your existing signup function is fine
);

// Logs in an existing user for the web app.
export const login = api<LoginRequest, AuthResponse>(
  // ... your existing login function is fine
);

// Logs out the current user.
export const logout = api<void, LogoutResponse>(
  // ... your existing logout function is fine
);

// The getToken function has been REMOVED from this file.
