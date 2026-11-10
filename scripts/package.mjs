import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  cpSync,
  existsSync,
  readdirSync,
  rmSync,
} from "node:fs";
import { join } from "node:path";
const root = process.cwd();
const workerDir = readdirSync("dist").find(
  (p) =>
    p !== "client" && p !== "server" && existsSync(join("dist", p, "index.js")),
);
if (!workerDir) throw new Error("Missing Worker module output");
mkdirSync("dist/server", { recursive: true });
cpSync(join("dist", workerDir, "index.js"), "dist/server/index.js");
const config = JSON.parse(
  readFileSync(join("dist", workerDir, "wrangler.json"), "utf8"),
);
delete config.configPath;
delete config.userConfigPath;
delete config.dev;
config.main = "index.js";
config.assets = { ...config.assets, directory: "../client" };
config.upload_source_maps = false;
config.d1_databases = (config.d1_databases || []).map((b) => ({
  ...b,
  migrations_dir: "../migrations",
}));
writeFileSync("dist/server/wrangler.json", JSON.stringify(config, null, 2));
rmSync(join("dist", workerDir), { recursive: true });
mkdirSync("dist/.openai", { recursive: true });
cpSync(".openai/hosting.json", "dist/.openai/hosting.json");
cpSync("migrations", "dist/migrations", { recursive: true });
const server = readFileSync("dist/server/index.js", "utf8");
if (server.includes("local-development-learner"))
  throw new Error("Development identity leaked into production build");
function inspect(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) inspect(p);
    else if (/^\.dev\.vars|^\.env/.test(f.name))
      throw new Error("Local secret file in release output");
  }
}
inspect("dist");
if (!existsSync("dist/client/index.html"))
  throw new Error("Client entrypoint missing");
console.log(
  "Validated Worker, client assets, migrations, and production auth/secret boundaries.",
);
