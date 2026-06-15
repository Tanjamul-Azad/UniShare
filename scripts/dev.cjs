const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const isWindows = process.platform === "win32";
const binDir = path.join(root, "node_modules", ".bin");

const binPath = (name) =>
  path.join(binDir, isWindows ? `${name}.cmd` : name);

let shuttingDown = false;
const children = new Set();

const startProcess = (command, args, envOverrides = {}) => {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...envOverrides },
    shell: isWindows,
  });

  children.add(child);

  child.on("exit", (code) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    for (const proc of children) {
      if (proc.pid && proc.pid !== child.pid) {
        proc.kill("SIGINT");
      }
    }

    if (typeof code === "number" && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
};

startProcess(binPath("tsx"), ["watch", "backend/server.ts"], {
  SKIP_VITE: "true",
  PORT: "3000",
});

startProcess(binPath("vite"), ["--config", "frontend/vite.config.ts"]);

const shutdown = (signal) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const proc of children) {
    proc.kill(signal);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
