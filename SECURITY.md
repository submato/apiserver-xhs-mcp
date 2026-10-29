# Security Policy

## Reporting a vulnerability

Do not publish credentials, exploit details, or customer data in a public issue.

Open a private security advisory from the repository's **Security → Advisories → Report a vulnerability** page. Include:

- affected version or commit
- impact and prerequisites
- minimal reproduction steps
- suggested mitigation, if known

Maintainers will acknowledge a complete report as soon as practical and coordinate disclosure after a fix is available.

## Credential handling

- Supply customer API Server tokens only through the MCP HTTP `Authorization` header.
- Never put customer tokens in tool arguments, URLs, source code, screenshots, or logs.
- Never commit `.env` files. `.env.example` contains names and safe placeholders only.
- Terminate TLS before public traffic reaches the MCP endpoint.
- Use HTTPS for the upstream API Server. Plain HTTP exposes customer tokens in transit.
- Rotate any token immediately if it appears in source control or logs.

## Operator checklist

- Configure edge request and connection limits.
- Preserve API Server's per-account billing and QPS controls.
- Redact authorization headers in proxy and application logs.
- Alert on unusual call volume, repeated authorization failures, and upstream billing errors.
- Keep dependencies patched and run the CI test suite before deployment.
- Restrict outbound traffic to the configured API Server origin.
- Define retention, deletion, abuse-reporting, and incident-response procedures.

## Scope

Security reports should concern this MCP gateway. Availability, pricing, account balance, and upstream data accuracy are controlled by the separately operated API Server.
