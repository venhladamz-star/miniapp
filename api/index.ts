import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// API Keys
const BEEKNOEE_API_KEY = process.env.BEEKNOEE_API_KEY || "sk-bee-d02b0d2101de40a591d219017c5b6cb6";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "C6M7F3663wXaOawLfH9wOHaFRsZ11hot";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "c568e0543d35f837fc96b646b4e7abfd";
const WAQI_TOKEN = process.env.WAQI_TOKEN || "D4fc8ccb8e847042dea04044a24c2c2a5895b083";
const SERPAPI_KEY = process.env.SERPAPI_KEY || "25ee68b4e9b34e524ab399a6d2b6aace7a32fe07a6c95aa4101391934c88976d";

const goldData = {
    "XAUUSD": { name: "Vàng Thế giới", current: 2350.5, history: [2340, 2345, 2350] },
    "SJL1L10": { name: "SJC 1L - 10L", current: 82000, history: [81000, 81500, 82000] },
    "SJ9999": { name: "SJC 9999", current: 81000, history: [80000, 80500, 81000] }
};

// Helper for retrying
async function retryAI(callback: () => Promise<any>, maxRetries = 2) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await callback();
    } catch (error: any) {
      lastError = error;
      if (error.response?.status === 429 && i < maxRetries) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/api/gold/prices', (req, res) => {
    const { type, days, action } = req.query;
    if (type && days) {
      const n = parseInt(days as string);
      const data = goldData[type.toString().toUpperCase() as keyof typeof goldData];
      if (!data) return res.status(404).json({ error: "Not found" });
      return res.json({ type: type.toString().toUpperCase(), history: data.history.slice(-n) });
    }
    if (type) {
      const data = goldData[type.toString().toUpperCase() as keyof typeof goldData];
      if (!data) return res.status(404).json({ error: "Not found" });
      if (action === "summary") return res.json({ type: type.toString().toUpperCase(), average: "81500", trend: "up" });
      return res.json({ type: type.toString().toUpperCase(), price: data.current });
    }
    const allPrices = Object.keys(goldData).map(key => ({
      code: key,
      name: goldData[key as keyof typeof goldData].name,
      price: goldData[key as keyof typeof goldData].current
    }));
    res.json(allPrices);
});

app.post('/api/ai/beeknoee', async (req, res) => {
  try {
    const response = await retryAI(() => 
      axios.post('https://platform.beeknoee.com/api/v1/chat/completions', req.body, {
        headers: { 'Authorization': `Bearer ${BEEKNOEE_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 60000
      })
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.post('/api/ai/mistral', async (req, res) => {
  try {
    const response = await retryAI(() => 
      axios.post('https://api.mistral.ai/v1/chat/completions', req.body, {
        headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 60000
      })
    );
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/api/weather', async (req, res) => {
  const { lat, lon } = req.query;
  try {
    const currentRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: { lat, lon, appid: OPENWEATHER_API_KEY, units: 'metric' }
    });
    const forecastRes = await axios.get(`https://api.openweathermap.org/data/2.5/forecast`, {
      params: { lat, lon, appid: OPENWEATHER_API_KEY, units: 'metric' }
    });
    const dailyMap: Record<string, any> = {};
    forecastRes.data.list.forEach((item: any) => {
      const d = new Date(item.dt * 1000);
      const dayKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      if (!dailyMap[dayKey]) {
        dailyMap[dayKey] = { dt: item.dt, temp: { max: item.main.temp_max, min: item.main.temp_min }, weather: item.weather };
      } else {
        dailyMap[dayKey].temp.max = Math.max(dailyMap[dayKey].temp.max, item.main.temp_max);
        dailyMap[dayKey].temp.min = Math.min(dailyMap[dayKey].temp.min, item.main.temp_min);
      }
    });

    res.json({
      current: { temp: currentRes.data.main?.temp, humidity: currentRes.data.main?.humidity, wind_speed: currentRes.data.wind?.speed, weather: currentRes.data.weather },
      daily: Object.values(dailyMap).slice(0, 5)
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/api/geocoding', async (req, res) => {
  const { q } = req.query;
  try {
    const response = await axios.get(`https://api.openweathermap.org/geo/1.0/direct`, {
      params: { q, limit: 1, appid: OPENWEATHER_API_KEY }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/api/aqi', async (req, res) => {
  const { city, latlng } = req.query;
  try {
    let url = `https://api.waqi.info/feed/here/?token=${WAQI_TOKEN}`;
    if (city) url = `https://api.waqi.info/feed/${encodeURIComponent(city.toString())}/?token=${WAQI_TOKEN}`;
    else if (latlng) url = `https://api.waqi.info/feed/geo:${latlng.toString().replace(',', ';')}/?token=${WAQI_TOKEN}`;
    const response = await axios.get(url);
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

app.get('/api/search', async (req, res) => {
  try {
    const response = await axios.get('https://serpapi.com/search', { params: { ...req.query, api_key: SERPAPI_KEY } });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

export default app;
