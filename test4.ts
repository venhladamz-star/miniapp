import axios from 'axios';
const getWeatherVisuals = async () => {
    try {
        const currentRes = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
            params: { lat: 21, lon: 105, appid: "c568e0543d35f837fc96b646b4e7abfd", units: 'metric' }
          });
          console.log('weather success', currentRes.data.main?.temp);
    } catch (e) {
        console.error('weather error', e.response?.status, e.response?.data);
    }
}

const getAqi = async () => {
    try {
        const url = `https://api.waqi.info/feed/here/?token=D4fc8ccb8e847042dea04044a24c2c2a5895b083`;
        const res = await axios.get(url);
        console.log('aqi success', res.data.status);
    } catch (e) {
        console.error('aqi error', e.response?.status, e.response?.data);
    }
}
getWeatherVisuals();
getAqi();
