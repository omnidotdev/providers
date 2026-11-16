---
"@omnidotdev/providers": minor
---

The Prism analytics client now carries first-touch campaign attribution: the whitelisted `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, and `ref` parameters from the URL a tab landed on are kept for that tab and attached to every event, so conversions (e.g. a signup several pages later) can be broken down by source and campaign. The rest of the query string is never sent.
