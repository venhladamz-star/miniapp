import http from 'http';
const data = JSON.stringify({
  model: 'glm-4.7-flash',
  messages: [{ role: 'user', content: 'test' }]
});
const req = http.request('http://localhost:3000/api/ai/beeknoee', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log(res.statusCode, d));
});
req.on('error', e => console.error(e));
req.write(data);
req.end();
