<!-- prev: features.md | next: ../04-retrospective/index.md -->

# FAQ & Troubleshooting

## Frequently Asked Questions

### General

**Q: What is PlusDateApp?**

A: PlusDateApp is a Telegram Mini App dating platform with profile onboarding, media moderation, discovery feed, swipes, likes, matches, chat, and premium subscription flows.

---

**Q: Do I need a separate account?**

A: No separate email/password account is planned for the main flow. The application uses Telegram as the entry point and the backend protects user routes through Laravel Sanctum.

---

**Q: Can I use the app outside Telegram?**

A: Developers can run the SPA in a browser for local testing, but the intended product experience depends on Telegram Mini App initialization.

---

### Account & Access

**Q: Why am I redirected to onboarding?**

A: The account is not fully onboarded. Complete all required onboarding steps before using the feed.

---

**Q: Why am I redirected to moderation?**

A: Your profile has an unresolved moderation issue, usually related to uploaded media or verification requirements.

---

**Q: Can I delete my account?**

A: Yes. The profile/settings flow includes account deletion, and the backend stores deletion snapshot data for restore-related behavior.

---

### Features

**Q: Why do I see no profiles in the feed?**

A: Possible reasons include strict search preferences, no available profiles in seed data, unresolved moderation, or all matching profiles already being swiped.

---

**Q: When can I chat with another user?**

A: Chat is intended for matched users. A match is created when both users express a positive decision.

---

**Q: What does premium provide?**

A: Premium is represented by the premium page, subscription endpoints, and premium-facing UI such as limits, filters, likes, and revert-related flows. Exact benefits should be finalized in the deployed product copy.

## Troubleshooting

### Common Issues

| Problem | Possible Cause | Solution |
|---------|---------------|----------|
| Page does not load locally | Frontend dev server is not running | Run `npm run dev` in `spa`. |
| API requests fail locally | Backend or Docker services are stopped | Start API services and check `/api/healthcheck`. |
| Login fails | Telegram initialization data is missing or invalid | Test inside Telegram Mini App context or add a documented local auth mock. |
| Feed is empty | No seeded profiles, strict preferences, or moderation state | Seed database and relax preferences. |
| Upload fails | File type, size, storage, or credentials issue | Check storage environment variables and backend logs. |
| Chat does not update live | Socket host/auth URL is misconfigured | Check `VITE_SOCKET_*` variables and Laravel Reverb configuration. |
| Payment flow fails | Stripe or Telegram invoice credentials are not configured | Check payment environment variables and backend logs. |

### Error Messages

| Error Code/Message | Meaning | How to Fix |
|-------------------|---------|------------|
| `401 Unauthorized` | User is not authenticated or Sanctum session/token is missing. | Log in through Telegram again and check API auth configuration. |
| `403 Forbidden` | The action is blocked by a rule or policy. | Verify profile state, moderation state, and ownership of the resource. |
| `422 Unprocessable Entity` | Request validation failed. | Check required fields, file format, and form values. |
| `500 Internal Server Error` | Backend exception or missing infrastructure dependency. | Check Laravel logs, `.env`, database, Redis, and storage services. |

### Browser-Specific Issues

| Browser | Known Issue | Workaround |
|---------|-------------|------------|
| Telegram WebView | Depends on Telegram version and platform behavior. | Use the latest Telegram app. |
| Safari iOS | Media upload permissions may require user interaction. | Reopen upload dialog and check browser permissions. |
| Desktop Chrome | Telegram-specific APIs may be absent. | Use desktop only for development, not final product testing. |

## Getting Help

### Self-Service Resources

- [Project Overview](../01-project-overview/index.md)
- [Deployment & DevOps](../02-technical/deployment.md)
- [API Reference](../appendices/api-reference.md)
- [Database Schema](../appendices/db-schema.md)

### Contact Support

| Channel | Response Time | Best For |
|---------|--------------|----------|
| Repository issue tracker | Depends on project owner | Bugs, technical improvements, and documentation fixes |
| Supervisor communication | Academic schedule | Diploma scope and assessment questions |

### Reporting Bugs

When reporting a bug, include:

1. Steps to reproduce.
2. Expected behavior.
3. Actual behavior.
4. Screenshot or screen recording if relevant.
5. Browser, device, Telegram version, and environment.
6. Backend logs or network response if available.
