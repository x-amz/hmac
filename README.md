# HMAC CloudFront Function

This project deploys an AWS CloudFront Function that calculates an HMAC
using `SHA-256`. The key and data values are provided via the `key` and
`data` query string parameters. Both values must be URL safe base64
encoded and no longer than 128 bytes when decoded.

The response body contains the HMAC value, encoded as URL safe base64.
