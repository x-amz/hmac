var crypto = require('crypto');

async function handler(event) {
  // This function runs at viewer-request time so it can respond directly. A
  // viewer-response function cannot change the origin response status to the
  // redirect required by this API, and is skipped entirely when the origin
  // returns an error for a path it does not serve.
  var response = { headers: {} };
  var parts;

  try {
    parts = event.request.uri.split('/').filter(Boolean).map(decodeURIComponent);
  } catch (error) {
    return fail(response, 'invalid URL encoding');
  }

  if (!parts.length) {
    return fail(response, 'use /{base64url-key}/{data}[/{data}...]');
  }

  var encodedKey = parts.shift();
  var key;
  try {
    key = base64UrlDecode(encodedKey);
  } catch (error) {
    return fail(response, 'invalid base64url key');
  }

  if (!key.length || key.length > 128 || parts.some(function (part) { return part.length > 128; })) {
    return fail(response, 'parameter empty or too long');
  }

  // Browsers and `curl -L` follow the completion redirect. Render that digest
  // instead of replacing it with usage advice; another path component can be
  // appended to the same URL to continue the chain.
  if (!parts.length) return result(response, encodedKey, 200);

  var digest;
  for (var i = 0; i < parts.length; i++) {
    var hmac = crypto.createHmac('sha256', key);
    hmac.update(parts[i]);
    // The runtime has no Buffer: take the digest as base64url text and decode
    // it back to bytes to key the next round.
    digest = hmac.digest('base64url');
    key = base64UrlDecode(digest);
  }

  return result(response, digest, 303);
}

function result(response, digest, statusCode) {
  response.statusCode = statusCode;
  response.statusDescription = statusCode === 303 ? 'See Other' : 'OK';
  if (statusCode === 303) response.headers.location = { value: '/' + digest };
  response.headers['cache-control'] = { value: 'no-store' };
  response.headers['content-type'] = { value: 'text/plain; charset=utf-8' };
  response.body = { encoding: 'text', data: digest };
  return response;
}

function fail(response, message) {
  response.statusCode = 400;
  response.statusDescription = 'Bad Request';
  response.headers['cache-control'] = { value: 'no-store' };
  response.headers['content-type'] = { value: 'text/plain; charset=utf-8' };
  response.body = { encoding: 'text', data: message };
  return response;
}

function base64UrlDecode(str) {
  if (!/^[A-Za-z0-9_-]+$/.test(str)) throw new Error('invalid base64url');
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  var binary = atob(str);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
