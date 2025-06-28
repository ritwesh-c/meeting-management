# meeting-management

This monorepo groups code for several services used to manage meetings:

- **calcom/** – placeholder for Cal.com related code.
- **attendee/** – placeholder for the Attendee application.
- **glue-service/** – Node.js service that connects Cal.com and Attendee.
  It exposes a `/webhook` endpoint to trigger transcript processing.

See [AGENTS.md](AGENTS.md) for development guidelines including testing commands.

