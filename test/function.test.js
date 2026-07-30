const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

const context = { Buffer, require };
vm.runInNewContext(fs.readFileSync('function.js', 'utf8'), context);

async function request(uri) {
  return context.handler({
    request: { uri },
    response: { headers: {} },
  });
}

test('redirects a single HMAC to its chainable digest URL', async () => {
  const key = Buffer.from('secret').toString('base64url');
  const expected = crypto.createHmac('sha256', 'secret').update('hello').digest('base64url');
  const response = await request(`/${key}/hello`);

  assert.equal(response.statusCode, 303);
  assert.equal(response.headers.location.value, `/${expected}`);
  assert.equal(response.headers['cache-control'].value, 'no-store');
});

test('derives a complete SigV4 signing key with the shortcut', async () => {
  let expected = crypto.createHmac('sha256', 'AWS4secret').update('20260730').digest();
  const dateKey = expected.toString('base64url');
  for (const value of ['us-east-1', 's3', 'aws4_request']) {
    expected = crypto.createHmac('sha256', expected).update(value).digest();
  }

  const response = await request(`/${dateKey}/us-east-1/s3`);
  assert.equal(response.headers.location.value, `/${expected.toString('base64url')}`);
});

test('chains arbitrary explicit data components in order', async () => {
  let expected = Buffer.from('key');
  for (const value of ['one', 'two', 'three']) {
    expected = crypto.createHmac('sha256', expected).update(value).digest();
  }

  const response = await request(`/${Buffer.from('key').toString('base64url')}/one/two/three`);
  assert.equal(response.headers.location.value, `/${expected.toString('base64url')}`);
});

test('rejects missing parameters and malformed keys', async () => {
  assert.equal((await request('/')).statusCode, 400);
  assert.equal((await request('/not+base64/data')).statusCode, 400);
});
