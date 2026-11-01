# Council landing deployment automation

This workflow is intentionally manual and uses the protected GitHub Actions environment `council-production`. It remains unusable until separately authorized credentials and a restricted deployment identity are provisioned. Declaring an environment in YAML does not itself require approval: configure required reviewers in GitHub before adding credentials.

## Required setup

1. On the Council host, create a dedicated unprivileged `council-deploy` account with an SSH public key restricted by `authorized_keys` to a **fixed server-side command**. Disable port forwarding, PTY and agent forwarding. Do not use the root password or store it in GitHub.
2. Implement and review the server-side `council-landing-deploy` command. It must accept only a 64-hex-character SHA-256 argument, stream a bounded tar.gz from stdin into a private temporary file, verify its checksum, invoke the reviewed `scripts/install-council-landing.py` through a narrowly scoped privileged wrapper, hold the shared Council operations lock, verify exact candidate RU/EN page hashes through direct-origin HTTPS with hostname verification, preserve the existing login/API checks and roll back the static symlink on failure. Nginx configuration changes belong to the initial guarded operator cutover; the receiver only switches static content. It must not allow arbitrary shell commands or alter Hermes credentials.
3. Add environment `council-production` with required reviewers and restrict deployments to `main`.
4. Configure secrets `COUNCIL_DEPLOY_SSH_KEY` and `COUNCIL_DEPLOY_KNOWN_HOSTS` (host key verified out of band), and variables `COUNCIL_DEPLOY_HOST`, `COUNCIL_DEPLOY_USER`. Use the dedicated account, not root.
5. Stage the first reviewed artifact manually, then apply the reviewed Council Nginx route through its guarded route manager and verify the origin. Never switch the root route before an artifact is installed. Retain the previous Nginx route for initial-cutover rollback; later static deployments do not change Nginx. Existing auth routes must remain protected.
6. Invoke workflow manually with the successful blog main workflow run ID and exact artifact name. It runs only from main, verifies that the source is a successful main push of `.github/workflows/gh-pages.yml`, and checks that the artifact name matches its commit SHA.

## Safety notes

The workflow does not contain credentials, create SSH users, enable remote login, install server-side wrappers or modify production by itself. Until these prerequisites are complete, manual execution must fail closed.

The blog is the canonical source repository for static assets. The public site remains `https://council.zavarov.com/`, while `/login`, `/auth`, `/api` and `/integrations/linear` remain on the protected application origin.
