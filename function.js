var crypto = require('crypto');

async function handler(event) {
  var response = event.response;
  response.statusDescription = 'OK';
  response.headers['content-type'] = { value: 'text/plain' };
  response.headers['content-encoding'] = { value: 'identity' };

  var qs = event.request.querystring || {};
  if (!qs.key || !qs.data) {
    response.statusCode = 400;
    response.body = { encoding: 'text', data: 'missing key or data' };
    return response;
  }

  var keyBytes = base64UrlDecode(qs.key.value);
  var dataBytes = base64UrlDecode(qs.data.value);

  if (keyBytes.length > 128 || dataBytes.length > 128) {
    response.statusCode = 400;
    response.body = { encoding: 'text', data: 'parameter too long' };
    return response;
  }

  var hmac = crypto.createHmac('sha256', keyBytes);
  hmac.update(dataBytes);
  var out = hmac.digest('base64url');

  response.statusCode = 200;
  response.body = { encoding: 'text', data: out };
  return response;
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  var binary = atob(str);
  var bytes = new Uint8Array(binary.length);
  for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

