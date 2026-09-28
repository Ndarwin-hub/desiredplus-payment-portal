# Desired Plus Payment Portal — standalone build

Standalone customer-facing payment portal, intentionally separate from the existing Desired Plus Worker and Pinterest/Railway automation.

## Customer flow
- Page 1: Payment Methods
  - Nepal Payment (नेपाल): Nabil Bank Limited, eSewa
  - International Payment: USDT TRC20, USDT BEP20, USDT ERC20, NETELLER, SKRILL, PAYONEER
  - Each Pay button is green and remains at the far right of the same row.
- Page 2: selected method only
  - Nepal/International minimum and 30-minute time
  - Every individual payment detail has its own Copy button
  - Copy -> ✅ Copied -> Copy
  - Each method has an independent QR slot
  - Screenshot is only a friction gate; it is not uploaded, inspected, verified, or stored
  - Contact Details stays grey/disabled until any image is selected
- Page 3:
  - Verification message
  - Larger WhatsApp logo
  - DARWIN NIROULA / ndarwin1414 / +9779842723995
  - Green Direct Message button

## Important production work still required
The current owner editor is a staging implementation using browser localStorage. It is not yet suitable for production because a real owner editor needs authenticated server-side configuration/storage. QR images and verified official logo assets also need to be connected before production launch.

Official provider resources were checked while preparing the build, including Nabil Bank and eSewa official sites. eSewa's official site also exposes its logo guidelines/official-logo resources. Nabil's official site provides its current brand and contact resources.

## Deployment plan
Use a new Cloudflare Pages project connected to this repository. Do not replace or modify the existing Desired Plus Worker until the new site has been tested independently.
