import axios from 'axios';
const BEEKNOEE_API_KEY = "sk-bee-d02b0d2101de40a591d219017c5b6cb6";
axios.post('https://platform.beeknoee.com/api/v1/chat/completions', {
  model: 'glm-4.7-flash',
  messages: [{ role: 'user', content: 'test' }]
}, {
  headers: { 'Authorization': `Bearer ${BEEKNOEE_API_KEY}`, 'Content-Type': 'application/json' },
}).then(res => console.log('success', res.data)).catch(err => {
  console.log('error', err.response?.status, err.response?.data, err.message);
});
