# Security Policy

## Supported versions

Only the latest minor version receives security fixes.

| Version | Supported |
| ------- | --------- |
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Email the maintainer: **hello@chrisadams.io**, or use GitHub's private vulnerability reporting on the repository.

Include:

- A description of the issue and its impact.
- A proof-of-concept or reproduction steps.
- Affected version(s).

You should receive an acknowledgement within 72 hours. Fixes are typically released within 14 days, faster for anything actively exploitable.

## Scope

In scope:

- XSS, prototype pollution, or DoS caused by `panes` public APIs with documented inputs.
- Listener-leak or teardown bugs with observable security impact.

Out of scope:

- Unsanitized HTML placed inside `.pane-content` by the consuming application (user's responsibility).
- Styling conflicts with user CSS.
- Behavior requiring a modified browser.
