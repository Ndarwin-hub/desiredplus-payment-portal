# Desired Plus Payment Portal

Standalone payment portal. This repository is separate from the existing Desired Plus contact Worker and Pinterest/Railway automation.

## Secure owner editor

Open the public Worker URL with #admin. The owner editor uses a server-side ADMIN_PASSWORD, an HttpOnly signed session cookie, and Cloudflare KV for central configuration. The password is never stored in GitHub or page JavaScript.

## One-time Cloudflare setup

1. Create a Workers KV namespace for this portal, for example desiredplus-payment-config.
2. Bind it to the new portal Worker as PAYMENT_CONFIG.
3. Add Worker secret ADMIN_PASSWORD with the owner password supplied for this build.
4. Deploy this repository using wrangler.toml.
5. Open the public URL and append #admin.

Do not change the existing desiredplus-contact Worker.

## Privacy

Customer payment screenshots are browser-local only. The portal does not upload, inspect, verify, store, or send them. The user sends the screenshot manually through WhatsApp.

QR and logo fields are editable by the owner. No QR image is invented by this build.
