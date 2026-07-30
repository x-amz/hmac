var crypto = require('crypto');

async function handler(event) {
  var response = event.response;
  var parts;

  try {
    parts = event.request.uri.split('/').filter(Boolean).map(decodeURIComponent);
  } catch (error) {
    return fail(response, 'invalid URL encoding');
  }

  if (parts.length < 2) {
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

  // A date key followed by region and service is the common SigV4 shortcut.
  // Complete its final, constant derivation step without putting another value in the URL.
  if (parts.length === 2) parts.push('aws4_request');

  for (var i = 0; i < parts.length; i++) {
    key = crypto.createHmac('sha256', key).update(parts[i], 'utf8').digest();
  }

  var digest = key.toString('base64url');
  response.statusCode = 303;
  response.statusDescription = 'See Other';
  response.headers.location = { value: '/' + digest };
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
