// Async/await error demo
function fetchUserData() {
  // Missing 'await' keyword
  const response = fetch('https://api.example.com/user');
  
  // This will fail because response is a Promise, not data
  console.log(response.data);
}

fetchUserData();
