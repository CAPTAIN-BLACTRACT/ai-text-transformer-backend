import { Service } from "encore.dev/service"

interface ServiceConfig {
  cors: {
    // Allow requests from browser extensions and your frontend
    allow_origins: [
      "chrome-extension://*", // All Chrome extensions
      "moz-extension://*",    // All Firefox extensions
      "https://staging-ai-text-transformer-backend-b8ri.frontend.encr.app", // Your frontend
      "http://localhost:*"    // Local development
    ],
    allow_methods: ["POST", "GET", "OPTIONS", "PUT", "DELETE"],
    allow_headers: ["*"],
    expose_headers: ["*"],
    allow_credentials: true,
    max_age: 86400, // 24 hours
  };
}

// Service setup
export default Service<ServiceConfig>({
  // Your service configuration
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
});