import { spawnSync } from "node:child_process";

const port = process.env.PORT ?? process.argv[2] ?? "3000";

const lsof = spawnSync("lsof", ["-ti", `tcp:${port}`], {
  encoding: "utf8"
});

if (lsof.status !== 0 && !lsof.stdout.trim()) {
  console.log(`No process is listening on port ${port}.`);
  process.exit(0);
}

const pids = lsof.stdout
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

if (!pids.length) {
  console.log(`No process is listening on port ${port}.`);
  process.exit(0);
}

for (const pid of pids) {
  const killed = spawnSync("kill", ["-9", pid], {
    encoding: "utf8"
  });

  if (killed.status !== 0) {
    console.error(`Failed to kill process ${pid} on port ${port}.`);
    process.exit(killed.status ?? 1);
  }
}

console.log(`Killed ${pids.length} process(es) on port ${port}.`);
