const url = 'https://functions.poehali.dev/0fe2adb1-b56f-4acd-aa46-246d52206d4d';
const body = {
  action: 'login',
  email: 'ourcryptoway@gmail.com',
  password: 'admin123'
};

console.log('Testing Auth Login Endpoint...');
console.log('URL:', url);
console.log('Request Body:', JSON.stringify(body, null, 2));
console.log('\n');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(body)
})
  .then(async response => {
    const status = response.status;
    const data = await response.json();
    
    console.log('=== AUTH LOGIN ENDPOINT TEST RESULTS ===\n');
    console.log(`1. HTTP Status Code: ${status}`);
    console.log(`2. Token returned: ${data.token ? 'YES' : 'NO'}`);
    if (data.token) {
      console.log(`   Token preview: ${data.token.substring(0, 60)}...`);
      console.log(`   Token length: ${data.token.length} characters`);
    }
    console.log(`3. Errors: ${data.error ? data.error : 'None'}`);
    
    if (data.user) {
      console.log('\n4. User Data:');
      console.log(`   - ID: ${data.user.id}`);
      console.log(`   - Email: ${data.user.email}`);
      console.log(`   - Full Name: ${data.user.full_name}`);
      console.log(`   - Is Admin: ${data.user.is_admin}`);
    }
    
    console.log('\n5. Full Response:');
    console.log(JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.log('=== AUTH LOGIN ENDPOINT TEST RESULTS ===\n');
    console.log('1. HTTP Status Code: ERROR');
    console.log('2. Token returned: NO');
    console.log(`3. Errors: ${error.message}`);
    console.log('\nError Details:');
    console.log(error);
  });