import { api, APIError, Response } from "encore.dev/api";
import { authDB } from "../auth/db";
import * as bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { secret } from "encore.dev/config";

const jwtSecret = secret("JWTSecret");

export interface LoginRequest {
  email: string;
  password: string;
}

// This endpoint is hit by the form on your new /extension-login page.
export const extensionLogin = api.raw<LoginRequest>(
  {
    expose: true,
    method: "POST",
    path: "/auth/extension-login",
  },
  async (req) => {
    const user = await authDB.queryRow`
      SELECT id, email, password_hash FROM users WHERE email = ${req.email}
    `;
    
    if (!user) { throw APIError.unauthenticated("invalid credentials"); }

    const isValidPassword = await bcrypt.compare(req.password, user.password_hash);
    if (!isValidPassword) { throw APIError.unauthenticated("invalid credentials"); }

    const token = jwt.sign({ userId: user.id, email: user.email }, jwtSecret(), { expiresIn: "7d" });

    // This is the HTML page we will send back to the browser.
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Success</title>
        <script>
          // This script saves the token and signals that it's done.
          localStorage.setItem("extensionAuthToken", "${token}");
          document.body.id = "auth-complete";
        </script>
      </head>
      <body>
        <p>Authentication successful. This window will now close.</p>
      </body>
      </html>
    `;

    // Return the HTML as the response.
    return Response.html(html);
  }
);

