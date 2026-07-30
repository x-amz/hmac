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

## AWS Signature Version 4

Keep the AWS secret access key off the network by deriving the date key locally:

```js
const crypto = require('node:crypto');
const dateKey = crypto
  .createHmac('sha256', `AWS4${process.env.AWS_SECRET_ACCESS_KEY}`)
  .update('20260730')
  .digest('base64url');
```

Then derive the complete SigV4 signing key in one request:

```text
https://hmac.sh/{dateKey}/{region}/{service}
```

The three-component SigV4 shortcut automatically performs the final
`aws4_request` HMAC step. For example, `/dateKey/us-east-1/s3` chains `us-east-1`,
`s3`, and `aws4_request`. Only the already-derived date key is sent to the
service; the AWS secret access key never is.

Path components are limited to 128 characters and keys to 128 decoded bytes.
Responses include `Cache-Control: no-store`.

The CloudFront Function is attached to the viewer-request event and returns the
result directly; requests do not reach the configured fallback origin.
