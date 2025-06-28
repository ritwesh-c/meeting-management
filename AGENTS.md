# Agent Guidelines

This repository is a monorepo containing several independent projects.

## Structure

- `calcom/` – placeholder for Cal.com code.
- `attendee/` – placeholder for Attendee application.
- `glue-service/` – Node.js service.

## Development

- Keep code for each project in its own directory.
- Use Node.js 18 or later for `glue-service`.
- When modifying `glue-service`, run:

```bash
cd glue-service
npm install    # if dependencies have changed
npm test
```

- Format code using Prettier if available.
- Write meaningful commit messages summarizing your changes.

