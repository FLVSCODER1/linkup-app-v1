# Calendar fetch security

Calendar preview/import and scheduled sync share `fetchPublicCalendarText`.
The fetcher allows HTTPS without URL credentials and accepts only public IPv4
or global-unicast IPv6 addresses. Loopback, private, link-local, shared-address,
multicast, reserved, documentation, mapped IPv4 and IPv6 transition ranges are
rejected. DNS results containing any unsafe address fail closed.

The HTTPS connection uses a custom lookup returning only the already-validated
address. The URL hostname is retained for Host and TLS certificate validation;
certificate checks are not disabled. A fresh, non-pooled connection prevents
socket reuse from defeating destination validation. This closes the separate
DNS-check/second-resolution rebinding gap.

Every redirect is checked again (including DNS) and its response is destroyed
before continuing. At most three redirects are followed. One ten-second deadline
covers DNS, redirects, headers and the entire streamed body, rather than
restarting the deadline at each hop.

The body is counted as bytes while streaming and the response is destroyed
immediately when it exceeds 2,000,000 bytes, even if Content-Length is missing
or false. Large declared bodies are rejected before reading. Identity encoding
is requested; compressed responses are explicitly rejected instead of accepting
decompression-bomb risk. A server that ignores identity encoding will therefore
produce a useful import failure, not silently bypass the limit. UTF-8 is decoded
only after the bounded byte stream is complete.

## Verification

Run `npm test -- --run app/lib/calendar/source-url.test.ts` and `npm run check`.
The tests exercise real Node streams and mocked DNS/HTTPS connections: exact
byte limits, split UTF-8, false lengths, compression, truncated streams, mapped
addresses, mixed DNS answers, pinned lookups, redirect revalidation and deadlines.
They never contact private hosts or change production data.

Before release, preview an approved public school calendar using a dedicated
test account; verify failure states for oversized/non-ICS URLs without publishing
events. Calendar sync and import UI behavior are unchanged apart from stronger
network validation. No production settings, secrets, rules or data are changed.
