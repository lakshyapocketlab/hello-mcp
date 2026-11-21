# Contributing

Thanks for helping. Requirements: Node 18+ (`.nvmrc` pins 20).

```sh
npm install
npm run typecheck
npm test -- --coverage   # 100% lines, branches, functions and statements are enforced
npm run build
```

- This package is a thin proxy. Do not add tools here: they live in the hosted Hello MCP server,
  so they never drift.
- Every change needs tests; coverage thresholds fail the run below 100%.
- Tests use an in-memory fake remote or a local HTTP server; never call the real API.
- Never log the API key, and write logs to stderr only (stdout carries the MCP stream).
- Update `CHANGELOG.md` and keep `src/version.ts` equal to `package.json`.
- Open a pull request against `main` with a short description of the change.
