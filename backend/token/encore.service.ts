// token/encore.service.ts
export default {
  cors: {
    allow_origins: [
      "chrome-extension://*",
      "moz-extension://*",
      "https://staging-ai-text-transformer-backend-b8ri.frontend.encr.app",
      "http://localhost:*"
    ],
    allow_methods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    allow_headers: ["*"],
    expose_headers: ["*"],
    allow_credentials: true,
    max_age: 86400,
  },
};