const fetch = require('node-fetch');

async function testRefresh() {
  try {
    // 1. Login dulu
    console.log('1. Testing login...');
    const loginResp = await fetch('http://localhost:4000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginResp.json();
    console.log('Login response:', loginResp.status, loginData);

    if (!loginResp.ok) {
      console.log('Login failed, cannot test refresh');
      return;
    }

    // Extract cookies from response
    const setCookieHeaders = loginResp.headers.raw()['set-cookie'];
    console.log('Cookies received:', setCookieHeaders);

    // 2. Test refresh
    console.log('\n2. Testing refresh...');
    const refreshResp = await fetch('http://localhost:4000/api/v1/auth/refresh', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': setCookieHeaders.join('; ')
      }
    });
    const refreshData = await refreshResp.json();
    console.log('Refresh response:', refreshResp.status, refreshData);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRefresh();
