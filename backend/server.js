import { fork } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonEnv = {
  ...process.env,
  AUTH_SERVICE: "http://localhost:8001",
  CHAT_SERVICE: "http://localhost:8002",
  AGENT_SERVICE: "http://localhost:8003",
  BILLING_SERVICE: "http://localhost:8004",
};

const microservices = [
  { name: "auth-service", script: "./services/auth/index.js", port: "8001" },
  { name: "chat-service", script: "./services/chat/index.js", port: "8002" },
  { name: "agent-service", script: "./services/agent/index.js", port: "8003" },
  { name: "billing-service", script: "./services/billing/index.js", port: "8004" },
];

console.log("==================================================");
console.log("🚀 Starting Cortex AI Unified Backend (Monolith)...");
console.log("==================================================");

microservices.forEach((service) => {
  console.log(`[INIT] Launching ${service.name} on internal port ${service.port}...`);
  const child = fork(path.resolve(__dirname, service.script), [], {
    env: {
      ...commonEnv,
      PORT: service.port,
    },
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    console.error(`[${service.name}] Process exited with code ${code}`);
  });
});

// Start Gateway on the public PORT after internal services initialize
setTimeout(() => {
  const publicPort = process.env.PORT || "8000";
  console.log(`[INIT] Launching Gateway on public port ${publicPort}...`);
  const gateway = fork(path.resolve(__dirname, "./gateway/index.js"), [], {
    env: {
      ...commonEnv,
      PORT: publicPort,
    },
    stdio: "inherit",
  });

  gateway.on("exit", (code) => {
    console.error(`[gateway] Process exited with code ${code}`);
  });
}, 2000);
