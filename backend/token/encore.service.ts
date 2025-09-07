import { Service } from "encore.dev/service";

// This defines the "token" service and applies a CORS policy to ALL endpoints within it.
export default new Service("token", {
  cors: {
    allowOrigins: ["chrome-extension://*"],
    allowMethods: ["POST"],
    allowHeaders: ["Content-Type"],
  },
});

