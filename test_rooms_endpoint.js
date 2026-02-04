import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function test() {
  try {
    console.log('Testing /rooms...');
    const res = await axios.get(`${API_URL}/rooms`);
    console.log('Status:', res.status);
    console.log('Rooms Count:', res.data.length);
    if (res.data.length > 0) {
        console.log('First Room:', res.data[0]);
    }
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

test();
