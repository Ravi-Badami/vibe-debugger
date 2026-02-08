// Null reference error demo
function getUserProfile() {
  const user = null; // Intentionally null
  
  // This will cause: Cannot read property 'name' of null
  console.log(user.name);
  
  return user;
}

getUserProfile();
