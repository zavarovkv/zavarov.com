# Council landing deployment

Edit the Council sources in this repository and push to `main`. The GitHub Pages
workflow builds and checks the blog, publishes it, then automatically deploys the
same build's Council archive to `https://council.zavarov.com/`. PRs run validation
only. No application image build or service restart is involved.

`deploy-council.yml` is shared by automatic publication and manual recovery. It
checks the source workflow, main branch, push event and artifact commit. Automatic
publication requires the current run's successful `deploy` job; the enclosing run
is still active. Rerunning a failed deployment reuses that successful build.
Manual publication requires a completed successful source run.

## One-time setup and key rotation

1. Complete the initial static-route cutover using the
   [Council operator guide](https://github.com/zavarovkv/agent-council/blob/main/docs/council-static-deploy.md).
2. Generate a dedicated Ed25519 key outside Git. On the server run
   `sudo bash scripts/setup-council-static-deploy.sh PUBLIC_KEY_FILE` from the
   reviewed Agent Council checkout. This installs a locked, unprivileged
   `council-deploy` account and root-owned forced-command receiver. Running it again
   with a new public key rotates access. Verify arbitrary commands are rejected.
3. Create the GitHub Actions environment `council-production`, permitting only the
   `main` branch. Automatic publication is owner-authorized; no reviewer or wait
   timer is configured. Environment configuration is part of setup, not YAML.
4. Set environment secrets `COUNCIL_DEPLOY_SSH_KEY` and
   `COUNCIL_DEPLOY_KNOWN_HOSTS` through GitHub's encrypted secret input. Obtain the
   server's host key through the existing trusted operator connection, not an
   unauthenticated scan. Set variables `COUNCIL_DEPLOY_HOST` and
   `COUNCIL_DEPLOY_USER=council-deploy`. Never use the operator/root key.
5. Verify one real automatic deployment and its origin checks. Remove the temporary
   local private key after upload and verification; rotate by repeating these steps.

The SSH key permits only `council-landing-deploy <sha256>` with a bounded archive
on stdin. It cannot start an interactive shell, forward ports or restart agents.
Only `/`, `/en/` and `/council/` static assets can change. Authentication, agent
configuration and Linear routes remain in Agent Council. The installer serializes
with other Council operations and briefly retries a busy lock. It validates the
archive and checks exact RU/EN bytes over direct-origin HTTPS, the login page and
the protected API. A failed check restores the previous static release.

## Recovery

For a transient failure, use **Re-run failed jobs** on the GitHub Pages run.
For rollback or republishing, run **Deploy Council landing** from `main`, supplying
the successful source run ID and its exact `council-landing-<sha>-deploy` artifact
name. Artifacts are retained for 14 days. For an older revision, revert the intended
source change on `main` and let the normal pipeline rebuild and publish it.
A failed Council deployment is visible as a failed blog workflow; the already
published blog stays available. Server-side checks preserve the prior Council
release on installation failure.
