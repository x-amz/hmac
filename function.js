var crypto = require('crypto');

async function handler(event) {
  // This function runs at viewer-request time so it can respond directly. A
  // viewer-response function cannot change the origin response status to the
  // redirect required by this API.
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

  var key;
  try {
    key = base64UrlDecode(parts.shift());
  } catch (error) {
    return fail(response, 'invalid base64url key');
  }

  if (!key.length || key.length > 128 || parts.some(function (part) { return part.length > 128; })) {
    return fail(response, 'parameter empty or too long');
  }

  // Browsers and `curl -L` follow the completion redirect. Render that digest
  // instead of replacing it with usage advice; another path component can be
  // appended to the same URL to continue the chain.
  if (!parts.length) return result(response, key.toString('base64url'), 200);

  // A date key followed by region and service is the common SigV4 shortcut.
  // Complete its final, constant derivation step without putting another value in the URL.
  if (parts.length === 2) parts.push('aws4_request');

  for (var i = 0; i < parts.length; i++) {
    key = crypto.createHmac('sha256', key).update(parts[i], 'utf8').digest();
  }

  return result(response, key.toString('base64url'), 303);
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
  return Buffer.from(str, 'base64');
}
