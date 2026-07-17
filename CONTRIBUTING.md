# Contributing to SaaS Product

We welcome contributions to this project! To keep development smooth, structured, and consistent, please follow these guidelines.

## Code of Conduct
This project and everyone participating in it is governed by standard professional behavior. We expect all contributors to be respectful, collaborative, and constructive.

## How Can I Contribute?

### Reporting Bugs
- Search existing issues/discussions before opening a new bug report.
- When reporting a bug, include clear steps to reproduce, the expected behavior, actual behavior, and relevant screenshots or logs.

### Requesting Features
- Outline the use case, why this feature is useful, and how it fits into the Next.js/Supabase/Stripe tech stack.

### Submitting Pull Requests (PRs)
1. Fork the repo and create your branch from `main`.
2. Follow the project's coding standards described in [coding-standards.md](file:///e:/76EAST/saas-product/docs/coding-standards.md).
3. If you've added or changed code, update documentation and add test steps in [testing.md](file:///e:/76EAST/saas-product/docs/testing.md).
4. Run code formatting and linting:
   ```bash
   npm run lint
   ```
5. Commit your changes using descriptive commit messages (e.g., `feat: add customer portal billing redirect`, `fix: webhook signature validation error`).
6. Submit a PR against the `main` branch.

## Branch Naming Conventions
- `feature/description-of-feature`
- `bugfix/description-of-bug`
- `docs/description-of-doc`
- `refactor/description-of-refactor`
