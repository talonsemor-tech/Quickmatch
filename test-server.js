// Simple test script to check if the API server is running
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3001,
  path: '/',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Server is running! Status: ${res.statusCode}`);
  res.on('data', (d) => {
    console.log('Response:', d.toString());
  });
});

req.on('error', (e) => {
  console.error('Server is not running:', e.message);
  console.log('Please start the server with: cd api-server && npm run dev');
});

req.end();