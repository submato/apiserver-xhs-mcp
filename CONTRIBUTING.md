# Contributing

Thanks for improving API Server Xiaohongshu MCP.

## Development

```bash
npm install
cp .env.example .env
npm run typecheck
npm test
npm run build
```

Use a test API Server account when exercising paid tools. Never include real tokens, customer data, or private upstream responses in tests, issues, or pull requests.

## Pull requests

- Keep each pull request focused on one change.
- Add or update tests for behavior changes.
- Document new tools and their API Server token cost.
- Keep tool permissions narrow and read-only unless a separate security review approves otherwise.
- Do not add arbitrary upstream URL, path, method, or signing parameters.
- Run type checking, tests, and the production build before submitting.

## Issues

Use GitHub Issues for reproducible bugs and narrowly scoped feature requests. Use the private process in [SECURITY.md](SECURITY.md) for vulnerabilities.
