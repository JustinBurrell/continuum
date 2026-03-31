# Inbound Email Routing — Feature Spec

## Current State

- Outbound email is fully configured: all transactional emails send from `noreply@usecontinuum.dev` via Resend
- No inbound routing exists — `hello@usecontinuum.dev` and `support@usecontinuum.dev` are referenced in legal pages but do not currently forward anywhere
- Domain is on Vercel DNS. Cloudflare Email Routing requires nameserver control (not viable). ImprovMX and Forwardemail.net restrict new domains on free tiers

---

## Goal

Forward inbound email from `hello@` and `support@` to a personal email address without changing nameservers or moving DNS away from Vercel.

---

## Addresses to Route

| Address | Purpose |
|---|---|
| `hello@usecontinuum.dev` | General inquiries, partnerships, outreach |
| `support@usecontinuum.dev` | User issues, bug reports, help requests |
| `noreply@usecontinuum.dev` | Outbound only — route to personal email to catch bounces |

---

## Recommended Approach

Once the domain is no longer considered "new" by forwarding services (typically 30 days):

1. Sign up for **ImprovMX** (free tier supports forwarding for custom domains)
2. Add domain `usecontinuum.dev`
3. ImprovMX provides two MX records — add them in **Vercel dashboard → Domains → `usecontinuum.dev` → DNS Records**
4. Create forwarding rules in ImprovMX:
   - `hello@usecontinuum.dev` → personal email
   - `support@usecontinuum.dev` → personal email
   - `noreply@usecontinuum.dev` → personal email (catches bounces/OOO replies)
5. No nameserver change required — Vercel retains full DNS control

---

## Future: Contact Form in App

Once inbound routing is live, consider adding a contact form on the landing page or About page that submits to `support@usecontinuum.dev`. This gives users a UI path to reach support without exposing the raw email address.

---

## Blockers

- Domain age restriction on free forwarding services (ImprovMX, Forwardemail.net)
- Revisit once `usecontinuum.dev` is at least 30 days old
