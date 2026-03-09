const axios = require('axios');

const API_URL = 'http://localhost:5000/api/data';

async function testApi() {
    try {
        console.log('Testing with a specific guidanceId...');
        // Use an ID that we know exists in subjects but might be "unknown" to guidances,
        // or a known one like 'e4c85e6...' (Lettres)
        const gid = 'e4c85e68-0c74-4ec8-b348-dda22aa6957';

        const res = await axios.get(`${API_URL}/subjects/${gid}`);
        console.log(`Results for ${gid}: ${res.data.length} subjects found.`);
        if (res.data.length > 0) {
            console.log('Sample:', res.data[0].title);
        }

        console.log('\nTesting with "all"...');
        const resAll = await axios.get(`${API_URL}/subjects/all`);
        console.log(`Results for "all": ${resAll.data.length} subjects found.`);

        process.exit(0);
    } catch (err) {
        console.error('API Test Failed:', err.message);
        process.exit(1);
    }
}

testApi();
