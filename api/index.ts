import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// API Keys from Environment
const BEEKNOEE_API_KEY = process.env.BEEKNOEE_API_KEY || "sk-bee-d02b0d2101de40a591d219017c5b6cb6";
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY || "C6M7F3663wXaOawLfH9wOHaFRsZ11hot";
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || "c568e0543d35f837fc96b646b4e7abfd";
const WAQI_TOKEN = process.env.WAQI_TOKEN || "D4fc8ccb8e847042dea04044a24c2c2a5895b083";
const SERPAPI_KEY = process.env.SERPAPI_KEY || "25ee68b4e9b34e524ab399a6d2b6aace7a32fe07a6c95aa4101391934c88976d";

const apiApp = express();
apiApp.use(express.json());

const goldData = {
    "XAUUSD": { name: "Vàng Thế giới", current: 2350.5, history: [2340, 2345, 2350] },
    "SJL1L10": { name: "SJC 1L - 10L", current: 82000, history: [81000, 81500, 82000] },
    "SJ9999": { name: "SJC 9999", current: 81000, history: [80000, 80500, 81000] }
};

async function retryAI(callback: () => Promise<any>, maxRetries = 2) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await callback();
    } catch (error: any) {
      lastError = error;
      if (error.response?.status === 429 && i < maxRetries) {
        const delay = Math.pow(2, i) * 1000;
        console.warn(`[AI Proxy] 429 hit, retrying in ${delay}ms...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}

// 1. Health & Debug
apiApp.get('/health', (req, res) => res.json({ status: 'ok', route: '/api/health is working natively' }));
apiApp.get('/api/health', (req, res) => res.json({ status: 'ok', route: 'double /api working natively' }));

apiApp.get('/debug-keys', (req, res) => {
  res.json({
    BEEKNOEE: BEEKNOEE_API_KEY ? `Present (ends in ${BEEKNOEE_API_KEY.slice(-4)})` : 'Missing',
    MISTRAL: MISTRAL_API_KEY ? `Present (ends in ${MISTRAL_API_KEY.slice(-4)})` : 'Missing',
    WEATHER: OPENWEATHER_API_KEY ? `Present (ends in ${OPENWEATHER_API_KEY.slice(-4)})` : 'Missing',
    AQI: WAQI_TOKEN ? `Present (ends in ${WAQI_TOKEN.slice(-4)})` : 'Missing',
    SERP: SERPAPI_KEY ? `Present (ends in ${SERPAPI_KEY.slice(-4)})` : 'Missing',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL
  });
});

// 2. Gold Price API
apiApp.get('/gold/prices', (req, res) => {
    const { type, days, action } = req.query;
    if (type && days) {
      const n = parseInt(days as string);
      if (isNaN(n) || n < 1 || n > 30) return res.status(400).json({ error: "Days must be 1-30" });
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

// 3. AI Chat Proxy (DeepSeek/Beeknoee)
apiApp.post('/ai/beeknoee', async (req, res) => {
  try {
    const response = await retryAI(() => 
      axios.post('https://platform.beeknoee.com/api/v1/chat/completions', req.body, {
        headers: { 'Authorization': `Bearer ${BEEKNOEE_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 60000 
      })
    );
    res.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message };
    if (status === 429) {
      return res.status(429).json({ error: "AI is currently very busy. Please wait a minute and try again." });
    }
    if (error.code === 'ECONNABORTED' || status === 524) {
      return res.status(524).json({ error: "AI Provider timed out. The server is taking too long to respond. Please try again." });
    }
    res.status(status).json(data);
  }
});

// 4. AI Chat Proxy (Mistral)
apiApp.post('/ai/mistral', async (req, res) => {
  try {
    const response = await retryAI(() => 
      axios.post('https://api.mistral.ai/v1/chat/completions', req.body, {
        headers: { 'Authorization': `Bearer ${MISTRAL_API_KEY}`, 'Content-Type': 'application/json' },
        timeout: 60000 
      })
    );
    res.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const data = error.response?.data || { error: error.message };
    if (status === 429) {
      return res.status(429).json({ error: "AI service limit reached. Please switch models or try again shortly." });
    }
    if (error.code === 'ECONNABORTED' || status === 524) {
      return res.status(524).json({ error: "AI Provider timed out. The server is taking too long to respond. Please try again." });
    }
    res.status(status).json(data);
  }
});

// 5. OpenWeather Proxy
apiApp.get('/weather', async (req, res) => {
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
        dailyMap[dayKey] = {
          dt: item.dt,
          temp: { max: item.main.temp_max, min: item.main.temp_min },
          weather: item.weather
        };
      } else {
        dailyMap[dayKey].temp.max = Math.max(dailyMap[dayKey].temp.max, item.main.temp_max);
        dailyMap[dayKey].temp.min = Math.min(dailyMap[dayKey].temp.min, item.main.temp_min);
      }
    });

    res.json({
      current: {
        temp: currentRes.data.main?.temp,
        humidity: currentRes.data.main?.humidity,
        wind_speed: currentRes.data.wind?.speed,
        weather: currentRes.data.weather
      },
      daily: Object.values(dailyMap).slice(0, 5)
    });
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

apiApp.get('/geocoding', async (req, res) => {
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

// 6. WAQI AQI Proxy
apiApp.get('/aqi', async (req, res) => {
  const { city, latlng } = req.query;
  try {
    let url = `https://api.waqi.info/feed/here/?token=${WAQI_TOKEN}`;
    if (city) {
      url = `https://api.waqi.info/feed/${encodeURIComponent(city.toString())}/?token=${WAQI_TOKEN}`;
    } else if (latlng) {
      const formattedPath = latlng.toString().replace(',', ';');
      url = `https://api.waqi.info/feed/geo:${formattedPath}/?token=${WAQI_TOKEN}`;
    }
    
    let response = await axios.get(url);
    if (latlng && (response.data?.status !== 'ok' || !response.data?.data?.aqi)) {
        url = `https://api.waqi.info/feed/here/?token=${WAQI_TOKEN}`;
        response = await axios.get(url);
    }
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// 7. SerpApi Google Search/Maps Proxy
apiApp.get('/search', async (req, res) => {
  try {
    const response = await axios.get('https://serpapi.com/search', {
      params: { ...req.query, api_key: SERPAPI_KEY }
    });
    res.json(response.data);
  } catch (error: any) {
    res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
  }
});

// Allow both / routed requests (if mounted under /api) and /api/ routed requests
const exportApp = express();
exportApp.use("/", apiApp);
exportApp.use("/api", apiApp);

export default exportApp;
