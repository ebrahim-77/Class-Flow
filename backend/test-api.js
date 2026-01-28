// Test API endpoints
const http = require('http');

const testLogin = () => {
  const postData = JSON.stringify({
    email: 'admin@classflow.com',
    password: 'admin123'
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('Testing login API...');
  console.log('Request:', { email: 'admin@classflow.com', password: 'admin123' });

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Status:', res.statusCode);
      console.log('Response:', JSON.parse(data));
      
      if (res.statusCode === 200) {
        console.log('\n✅ Login API is working!');
      } else {
        console.log('\n❌ Login failed');
      }
    });
  });

  req.on('error', (e) => {
    console.error('❌ Request error:', e.message);
  });

  req.write(postData);
  req.end();
};

// Test health first
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/health',
  method: 'GET'
};

console.log('Testing health endpoint...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Health check:', JSON.parse(data));
    console.log('\n---\n');
    testLogin();
  });
});

req.on('error', (e) => {
  console.error('❌ Cannot connect to backend:', e.message);
  console.log('\nMake sure the backend server is running on port 5000');
});

req.end();
