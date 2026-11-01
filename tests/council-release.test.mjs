import assert from "node:assert/strict";
import test from "node:test";
import { validateCouncilRelease } from "../scripts/validate-council-release.mjs";

const sha = "a".repeat(40);
function fixture() {
  return {
    run: { id: 123, head_branch: "main", event: "push", path: ".github/workflows/gh-pages.yml", head_sha: sha, run_attempt: 2, status: "in_progress", conclusion: null },
    jobs: { jobs: [{ name: "deploy", status: "completed", conclusion: "success" }] },
    env: { RUN_ID: "123", ARTIFACT: `council-landing-${sha}-deploy`, GITHUB_REF: "refs/heads/main", GITHUB_EVENT_NAME: "push", GITHUB_RUN_ID: "123", GITHUB_SHA: sha, GITHUB_RUN_ATTEMPT: "2" },
  };
}
function validate({ run, jobs, env }) { validateCouncilRelease(run, jobs, env); }

test("automatic deployment accepts its successful publication before the run ends", () => {
  assert.doesNotThrow(() => validate(fixture()));
});

test("automatic deployment rejects other runs, commits, attempts and incomplete publication", () => {
  for (const change of [
    (f) => { f.env.GITHUB_RUN_ID = "456"; },
    (f) => { f.env.GITHUB_SHA = "b".repeat(40); },
    (f) => { f.env.GITHUB_RUN_ATTEMPT = "3"; },
    (f) => { f.jobs.jobs[0].status = "in_progress"; },
    (f) => { f.jobs.jobs[0].conclusion = "failure"; },
    (f) => { f.jobs.jobs = []; },
  ]) {
    const f = fixture(); change(f);
    assert.throws(() => validate(f));
  }
});

test("both paths reject untrusted source workflows, branches, events and artifacts", () => {
  for (const change of [
    (f) => { f.run.head_branch = "feature"; },
    (f) => { f.run.event = "pull_request"; },
    (f) => { f.run.path = ".github/workflows/other.yml"; },
    (f) => { f.env.ARTIFACT = `council-landing-${"b".repeat(40)}-deploy`; },
    (f) => { f.env.RUN_ID = "123/attempts/1"; },
    (f) => { f.env.GITHUB_REF = "refs/heads/feature"; },
    (f) => { f.env.GITHUB_EVENT_NAME = "pull_request"; },
  ]) {
    const f = fixture(); change(f);
    assert.throws(() => validate(f));
  }
});

test("manual recovery requires a completed successful main build", () => {
  const f = fixture();
  f.env.GITHUB_EVENT_NAME = "workflow_dispatch";
  assert.throws(() => validate(f));
  f.run.status = "completed"; f.run.conclusion = "success";
  assert.doesNotThrow(() => validate(f));
  f.run.conclusion = "failure";
  assert.throws(() => validate(f));
});
