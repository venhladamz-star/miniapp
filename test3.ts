import axios from 'axios';
const MISTRAL_API_KEY = "C6M7F3663wXaOawLfH9wOHaFRsZ11hot";
axios.post('https://api.mistral.ai/v1/chat/completions', {
  model: 'mistral-large-latest',
  messages: [{ role: 'user', content: 'test' }]
}, {
  headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
}).then(res => console.log('success', res.data)).catch(err => {
  console.log('error', err.response?.status, err.response?.data, err.message);
});
