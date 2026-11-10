import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
const root = process.cwd();
const config = join(root, ".sites-runtime", "config");
mkdirSync(config, { recursive: true });
const child = spawn(
  process.execPath,
  [
    join(root, "node_modules", "vite", "bin", "vite.js"),
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      XDG_CONFIG_HOME: config,
      WRANGLER_LOG_PATH: join(root, ".wrangler", "logs"),
    },
  },
);
for (const sig of ["SIGTERM", "SIGINT"]) process.on(sig, () => child.kill(sig));
child.on("exit", (code) => process.exit(code ?? 1));
