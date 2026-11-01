import test from "node:test";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

test("Council archive preserves asset routes, integrity and page metadata", () => {
  execFileSync("python3", ["-m", "unittest", "discover", "-s", "tests", "-p", "test_council_bundle.py"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    stdio: "pipe"
  });
});
