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
2. Enable R2 in the Cloudflare account if it is not already enabled.
3. Create an R2 bucket named desiredplus-payment-media and bind it as MEDIA. The included wrangler.toml already declares this binding.
4. Set ADMIN_PASSWORD as a Worker Secret. Choose the password yourself; do not put it in GitHub.
5. Deploy this repository using the included wrangler.toml.
6. Open the public URL and append #admin.

Cloudflare Workers supports R2 through an r2_buckets binding. The Worker uses that binding for upload, replacement, deletion, and serving of logo/QR objects.

## Privacy

Customer payment screenshots are browser-local only. The portal does not upload, inspect, verify, store, or send them. The user sends the screenshot manually through WhatsApp.

Logo and QR files selected in the owner editor are stored in the R2 bucket and served through the Worker.

Do not change the existing desiredplus-contact Worker.
