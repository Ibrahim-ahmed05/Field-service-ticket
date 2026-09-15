import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Prevent a development NODE_ENV from .env or the shell producing mixed React
// runtimes in a production SSR bundle. Works on Windows and Vercel Linux.
const result = spawnSync(
  process.execPath,
  [fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url)), "build"],
  { stdio: "inherit", env: { ...process.env, NODE_ENV: "production" } },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
