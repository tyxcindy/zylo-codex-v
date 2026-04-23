import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";

const port = Number(process.env.PORT ?? "3000");
const host = "127.0.0.1";
const nextBinPath = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const healthUrl = `http://${host}:${port}/api/health`;

function isPortInUse() {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port });

    socket.once("connect", () => {
      socket.end();
      resolve(true);
    });

    socket.once("error", (error) => {
      if (error.code === "ECONNREFUSED") {
        resolve(false);
        return;
      }

      reject(error);
    });

    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(true);
    });
  });
}

async function probeExistingZyloServer() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);

  try {
    const response = await fetch(healthUrl, {
      signal: controller.signal
    });
    const payload = await response.json().catch(() => null);

    return response.ok && payload?.service === "zylo";
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const portInUse = await isPortInUse();

  if (portInUse) {
    const isZylo = await probeExistingZyloServer();

    if (isZylo) {
      console.log(`Zylo is already running at http://${host}:${port}`);
      return;
    }

    console.error(
      `Port ${port} is already in use by another process. Stop that process so Zylo can stay on http://${host}:${port}.`
    );
    process.exitCode = 1;
    return;
  }

  const child = spawn(process.execPath, [nextBinPath, "dev", "-p", String(port), ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 0);
  });
}

await main();
