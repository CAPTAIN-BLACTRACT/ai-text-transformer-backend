import { api, APIError, cors, Gateway } from "encore.dev/api";
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

// 1. Define the public API endpoint. It is automatically exposed by the gateway below.
const getToken = api<LoginRequest, AuthResponse>({
  expose: true,
  method: "POST",
  path: "/auth/get-token",
});

// 2. This Gateway is public (no authHandler) and has the CORS policy.
// It automatically picks up the 'getToken' endpoint defined above.
export default new Gateway(getToken, {
  cors: {
    allowOrigins: ["chrome-extension://*"],
    allowMethods: ["POST"],
    allowHeaders: ["Content-Type"],
  },
});


// 3. Define the implementation for the 'getToken' endpoint.
getToken.implement(async (req) => {
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
});

