# DeployIQ EC2 Deployment

This directory contains the host-side assets for running DeployIQ on EC2 instead of ECS/Fargate.

## What Lives Here

- `docker-compose.ec2.yml`: production Compose stack for the Next.js app plus Chroma
- `deploy-on-ec2.sh`: pulls the target image from ECR, restarts Compose, waits for the health check, and records the previous image for rollback
- `rollback-on-ec2.sh`: rolls the app back to the previously deployed image URI
- `audit-ec2-host.sh`: checks whether an EC2 host is ready to share the box with DeployIQ
- `deployiq.env.example`: example app environment file for `/opt/deployiq/shared/deployiq.env`
- `nginx.deployiq.conf.example`: reverse-proxy example that forwards traffic to `127.0.0.1:3001`

## Host Layout

The deploy scripts assume this filesystem layout on the EC2 host:

```text
/opt/deployiq/
  deploy/          # copy this repo's deploy/ directory here
  shared/
    deployiq.env   # production secrets and runtime env vars
  state/
    compose.env
    current-image-uri
    previous-image-uri
```

`buildspec.deploy.yml` sends an SSM Run Command that executes `/opt/deployiq/deploy/deploy-on-ec2.sh`.

## Required Host Software

- Docker Engine
- Docker Compose plugin or `docker-compose`
- AWS CLI v2
- Amazon SSM Agent registered and healthy
- An instance role that can:
  - receive SSM Run Command
  - read/pull from the `deployiq-web` ECR repository

Your CodeBuild service role also needs permission to call `ssm:SendCommand` and read command results with `ssm:ListCommandInvocations` or `ssm:GetCommandInvocation`.

## Required CodeBuild Deploy Variables

Set these on the deploy CodeBuild project or pipeline stage:

- `APP_REGION=ca-central-1`
- `IMAGE_REPO_NAME=deployiq-web`
- `DEPLOYIQ_DEPLOY_ROOT=/opt/deployiq`
- `DEPLOYIQ_PROJECT_NAME=deployiq`
- `DEPLOYIQ_LOCAL_PORT=3001`
- `DOCKER_PLATFORMS=linux/amd64`
- `REINDEX_REPO_FULL_NAME=Gurv-Chahal/deployiq`
- Either:
  - `DEPLOYIQ_EC2_INSTANCE_ID=i-...`
  - or `DEPLOYIQ_EC2_TARGET_TAG_KEY=...` plus `DEPLOYIQ_EC2_TARGET_TAG_VALUE=...`

If your shared host is `arm64`, set `DOCKER_PLATFORMS=linux/amd64,linux/arm64` so Buildx pushes a multi-arch manifest.

## Required App Env File

Create `/opt/deployiq/shared/deployiq.env` from `deployiq.env.example` and fill in real secrets.

Important values:

- `NEXTAUTH_URL` should stay on the final public DeployIQ hostname
- `CHROMA_URL` should be `http://chroma:8000` when Chroma runs in the same Compose stack
- `GITHUB_TOKEN_ENCRYPTION_KEY` must stay the same value as the old environment or existing encrypted GitHub tokens will stop decrypting

## AWS Changes Outside This Repo

These steps are required but not expressible from this codebase:

1. Attach an instance profile to the EC2 host with SSM and ECR pull permissions.
2. Update the RDS security group to allow the EC2 instance security group.
3. Copy this `deploy/` directory to `/opt/deployiq/deploy` on the EC2 host.
4. Add the reverse-proxy entry for the final hostname.
5. Update CodePipeline so the deploy stage uses this buildspec-driven SSM flow instead of the old ECS deploy stage.
6. After cutover and rollback validation, delete the old ECS service, unused task definitions, and any dedicated ALB resources that existed only for DeployIQ.

## Cutover Workflow

1. Copy `deploy/` to the host and create `/opt/deployiq/shared/deployiq.env`.
2. Run `bash /opt/deployiq/deploy/audit-ec2-host.sh` on the target instance.
3. Put the app behind a temporary reverse-proxy hostname or internal port and validate login, DB access, review generation, indexing, and Chroma retrieval.
4. Run the main deploy pipeline and confirm the instance pulls the new ECR image and passes the health check.
5. Switch the public hostname and GitHub callback settings if needed.
6. Keep the previous image URI until you have completed a rollback drill with `rollback-on-ec2.sh`.
