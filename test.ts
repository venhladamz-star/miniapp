import http from 'http';
http.get('http://localhost:3000/api/health', (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => console.log(d));
  res.on('error', e => console.error(e));
});
