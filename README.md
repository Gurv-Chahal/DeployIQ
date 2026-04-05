# DeployIQ
DeployIQ is a platform that goes beyond a PR review bot by analyzing a
code change in full system context, not just the diff itself.
It creates detailed risk reports using test coverage, past incidents, and
system history to show which parts of the product may be affected, what checks are missing,
and how the change should be released more safely.

# Using Drizzle Orm
- 1. pnpm db:generate
This compares your schema code to previous state and creates a migration file in drizzle/
- 2. pnpm db:migrate
Updates the real database
- 3. pnpm db:studio
inspect the changes visually

# Explaining how our database files work
- client.ts -> creates the db connection and exports db which our app uses to run queries
- schema.ts -> where we define our tables
- queries/ -> apps database operations like creating a CRUD operation using tables we created

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript
- Styling/UI: Tailwind CSS v4, shadcn/ui, Radix UI, Lucide React
- Database Access: Drizzle ORM
- Database Engine: PostgreSQL
- Package Manager: pnpm
- Containerization: Docker
- AWS Deployment: Amazon ECS on Fargate, Amazon ECR, AWS CodeBuild, AWS CodePipeline
- AWS Database: Amazon RDS for PostgreSQL
