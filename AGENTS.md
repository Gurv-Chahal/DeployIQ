# DeployIQ agent instructions

## Project goal
DeployIQ is a full-stack tool for analyzing code changes and generating deployment-risk reports.
It is not a PR review bot. Optimize for structured risk analysis, clear UI, and practical developer workflows.

## Stack
- TypeScript
- Next.js
- React
- LangGraph / LangChain
- Docker
- AWS

## Repo conventions
- Prefer TypeScript everywhere
- Keep code modular and strongly typed
- Avoid unnecessary dependencies
- Ask before changing core architecture
- Favor readable code over clever code

## Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Test: `pnpm test`

## Definition of done
Before finishing:
1. Run lint
2. Run tests for affected code
3. Update types if needed
4. Keep changes scoped to the task
5. Briefly explain what changed and why

## App priorities
- Strong UI for reports and dashboards
- Structured outputs over chat-style outputs
- Focus on risk, blast radius, rollout guidance, and missing checks
- Do not frame features as “AI code review”

## Important directories
- `src/app` → routes and pages
- `src/components` → UI components
- `src/lib` → shared logic
- `src/server` → backend logic / services
- `src/agents` → LangGraph workflows
- `tests` → test code