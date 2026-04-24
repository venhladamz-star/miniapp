import axios from 'axios';

const test = async () => {
    try {
        await axios.post('https://platform.beeknoee.com/api/v1/chat/completions', { foo: 'bar'}, {
          headers: { 'Authorization': `Bearer sk-bee-d02b0d2101de40a591d219017c5b6cb6`, 'Content-Type': 'application/json' },
          timeout: 60000 
        });
    } catch (e: any) {
        if (e.response?.status === 524) {
            console.log("524 exactly matched");
            console.log(e.response.data)
        } else {
            console.log("other", e.response?.status);
            console.log(e.response?.data);
            const errorDetail = e.response?.data?.error?.message || e.response?.data?.error || e.message;
            console.log("fallback:", errorDetail);
        }
    }
}
test();