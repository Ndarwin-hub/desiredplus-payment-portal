# Desired Plus Payment Portal

Standalone payment portal. This repository is separate from the existing Desired Plus contact Worker and Pinterest/Railway automation.

## Owner editor

Open the public Worker URL with /#admin.

- Choose your own ADMIN_PASSWORD in Cloudflare Worker Secrets/Environment Variables.
- The password is checked server-side and is never stored in GitHub or page JavaScript.
- The editor manages the portal logo, payment methods, payment details, minimum amounts, QR images, and WhatsApp information.
- Payment methods can be added, edited, or deleted. Every method automatically uses the same Page 2 -> Page 3 customer flow.
- Normal image management uses direct Android file upload with preview. URL fields remain available as an optional advanced fallback.

## One-time Cloudflare setup

1. Create/keep the Workers KV namespace used by this portal and bind it as PAYMENT_CONFIG.
2. Keep the existing Workers KV namespace bound as PAYMENT_CONFIG. It stores both portal configuration and uploaded logo/QR media, so R2 is not required.
3. Set ADMIN_PASSWORD as a Worker Secret. Choose the password yourself; do not put it in GitHub.
4. Deploy this repository using the included wrangler.toml.
5. Open the public URL and append #admin.

The owner editor uses direct Android file uploads. Logo and QR files are stored in the existing Workers KV namespace and served by the Worker. No R2 bucket, R2 API token, or custom domain is required.

## Privacy

Customer payment screenshots are browser-local only. The portal does not upload, inspect, verify, store, or send them. The user sends the screenshot manually through WhatsApp.

Logo and QR files selected in the owner editor are stored in the existing Workers KV namespace and served through the Worker.

Do not change the existing desiredplus-contact Worker.
