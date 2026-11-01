import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

// The automatic caller is still running: require its completed publication job,
// not completion of the entire workflow (which includes this deployment).
export function validateCouncilRelease(run, jobs, env) {
  assert.match(env.RUN_ID ?? "", /^[0-9]+$/);
  assert.match(env.ARTIFACT ?? "", /^council-landing-[a-f0-9]{40}-deploy$/);
  assert.equal(String(run.id), env.RUN_ID);
  assert.equal(run.head_branch, "main");
  assert.equal(run.event, "push");
  assert.equal(run.path, ".github/workflows/gh-pages.yml");
  assert.equal(env.ARTIFACT, `council-landing-${run.head_sha}-deploy`);
  assert.equal(env.GITHUB_REF, "refs/heads/main");
  if (env.GITHUB_EVENT_NAME === "push") {
    assert.equal(env.RUN_ID, env.GITHUB_RUN_ID);
    assert.equal(run.head_sha, env.GITHUB_SHA);
    assert.equal(String(run.run_attempt), env.GITHUB_RUN_ATTEMPT);
    const publication = jobs.jobs.filter((job) => job.name === "deploy");
    assert.equal(publication.length, 1);
    assert.equal(publication[0].status, "completed");
    assert.equal(publication[0].conclusion, "success");
  } else {
    assert.equal(env.GITHUB_EVENT_NAME, "workflow_dispatch");
    assert.equal(run.status, "completed");
    assert.equal(run.conclusion, "success");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const run = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const jobs = JSON.parse(readFileSync(process.argv[3], "utf8"));
  validateCouncilRelease(run, jobs, process.env);
  console.log(`Validated Council artifact from run ${run.id}, commit ${run.head_sha}`);
}
