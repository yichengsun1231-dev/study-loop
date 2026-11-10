import { spawn } from "node:child_process";
if (process.stdin.isTTY) process.stdin.setRawMode(true);
process.stdin.setEncoding("utf8");
process.stdout.write(
  "Ready for Site workflow JSON on stdin (input is hidden).\n",
);
let input = "";
process.stdin.on("data", async (chunk) => {
  input += chunk;
  if (!input.includes("\n") && !input.includes("\r")) return;
  process.stdin.pause();
  if (process.stdin.isTTY) process.stdin.setRawMode(false);
  try {
    const { credential } = JSON.parse(input.trim());
    input = "";
    const env = {
      ...process.env,
      GIT_TRACE: "0",
      GIT_CURL_VERBOSE: "0",
      GIT_TERMINAL_PROMPT: "0",
    };
    if (credential.auth_mode !== "work_proxy") {
      env.GIT_CONFIG_COUNT = "2";
      env.GIT_CONFIG_KEY_0 =
        "http." + new URL(credential.remote_url).origin + "/.extraheader";
      env.GIT_CONFIG_VALUE_0 = "Authorization: Bearer " + credential.token;
      env.GIT_CONFIG_KEY_1 = "credential.helper";
      env.GIT_CONFIG_VALUE_1 = "";
    }
    const child = spawn(
      "git",
      ["push", credential.remote_url, "HEAD:refs/heads/" + credential.branch],
      { stdio: ["ignore", "pipe", "pipe"], env },
    );
    let output = "";
    child.stdout.on("data", (x) => (output += x));
    child.stderr.on("data", (x) => (output += x));
    child.on("close", (code) => {
      if (code) {
        process.stderr.write(
          output.replaceAll(credential.token || "NO_SECRET", "[redacted]"),
        );
        process.exit(code);
      }
      process.stdout.write("Site source pushed successfully.\n");
      process.exit(0);
    });
  } catch {
    process.stderr.write("Source synchronization failed.\n");
    process.exit(1);
  }
});
