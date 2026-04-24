import express from 'express';
import axios from 'axios';
const app = express();
app.get('/test', (req, res) => {
  res.status(524).json({ error: "AI Provider timed out" });
});
app.listen(3001, async () => {
   try {
      await axios.get('http://localhost:3001/test');
   } catch(e) {
      console.log(e.response?.status === 524);
      console.log("message:", e.message);
      console.log("data:", e.response?.data);
   }
   process.exit(0);
});
