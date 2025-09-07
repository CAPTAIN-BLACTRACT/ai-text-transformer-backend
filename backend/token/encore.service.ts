import { defineService } from "encore.dev/service"

interface ServiceConfig {
  cors?: {
    allow_origins: string[];
    allow_methods: string[];
    allow_headers: string[];
    expose_headers: string[];
    allow_credentials: boolean;
    max_age: number;
  };
}

const config: ServiceConfig = {
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

export default defineService(config);