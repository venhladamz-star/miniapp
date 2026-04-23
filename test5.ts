import axios from 'axios';
const getAqi = async () => {
    try {
        const url = `https://api.waqi.info/feed/here/?token=D4fc8ccb8e847042dea04044a24c2c2a5895b083`;
        const res = await axios.get(url);
        console.log('aqi payload', res.data);
    } catch (e) {
        console.error('aqi error', e);
    }
}
getAqi();
