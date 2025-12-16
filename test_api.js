const https = require('https');

const apiKey = '8dad861b27msh758754a856e09c3p1ea780jsn80a6dcde9c6c';
const host = 'open-weather13.p.rapidapi.com';

function testEndpoint(path) {
    const options = {
        hostname: host,
        path: path,
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': apiKey,
            'X-RapidAPI-Host': host
        }
    };

    const req = https.request(options, res => {
        console.log(`Path: ${path} | Status: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`Path: ${path} | Status: ${res.statusCode}`);
            console.log('Body:', data.substring(0, 200));
        });
    });

    req.on('error', error => {
        console.error(`Error for ${path}:`, error);
    });

    req.end();
}

testEndpoint('/city/London/EN');
testEndpoint('/city/london/EN');
testEndpoint('/city/Hanoi/EN');
testEndpoint('/city/hanoi/EN');

