function handler(event) {
  var now = new Date();

  // Precompute each part manually to avoid closure + method calls
  var year = now.getUTCFullYear();
  var month = now.getUTCMonth() + 1;
  var day = now.getUTCDate();
  var hour = now.getUTCHours();
  var minute = now.getUTCMinutes();
  var second = now.getUTCSeconds();

  // Inline padding with arithmetic to avoid string method overhead
  var pad2 = (n) => (n < 10 ? '0' + n : '' + n);

  var timestamp = `${year}${pad2(month)}${pad2(day)}T${pad2(hour)}${pad2(minute)}${pad2(second)}Z`;

  var response = event.response;
  response.statusCode = 200;
  response.statusDescription = 'OK';
  response.headers['content-type'] = { value: 'text/plain' };
  response.headers['content-encoding'] = { value: 'identity' };
  response.headers['x-amz-date'] = { value: timestamp };
  response.body = {
    encoding: 'text',
    data: timestamp,
  };

  return response;
}
