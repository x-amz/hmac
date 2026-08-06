# hmac.sh

`hmac.sh` derives SHA-256 HMACs using positional URL path parameters. The first
component is a URL-safe, unpadded base64 key; every following component is
URL-decoded UTF-8 data. No argument labels or query string are needed:

```text
https://hmac.sh/{base64url-key}/{data}[/{data}...]
```

All data components are chained in order: each HMAC digest becomes the key for
the next component. A successful request responds with `303 See Other` and
redirects to `/{base64url-digest}`. Append another `/data` component to that URL
to continue a derivation. Following the redirect displays the digest with a
`200 OK` response rather than usage text.

To keep a root secret off the network, derive the first round locally and start
the URL from that intermediate digest.

Path components are limited to 128 characters and keys to 128 decoded bytes.
Responses include `Cache-Control: no-store`.

The CloudFront Function is attached to the viewer-request event and returns the
result directly; requests do not reach the configured fallback origin.
