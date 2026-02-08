// async-error.js - Demonstrates promise handling issues
// This file contains intentional async/await bugs

async function fetchUserData(userId) {
  try {
    // Bug: Not awaiting the promise
    const response = fetch(`https://api.example.com/users/${userId}`);
    // response is a Promise, not the actual response

    // Bug: Trying to access .json() on a Promise
    const userData = response.json(); // This will fail

    return userData;
  } catch (error) {
    // Bug: Not properly handling the error
    console.log('Error occurred:', error);
    throw error; // Re-throwing without context
  }
}

async function processUserData(userId) {
  try {
    // Bug: Not awaiting the async function call
    const userData = fetchUserData(userId);
    // userData is a Promise, not the actual data

    // Bug: Trying to access properties on a Promise
    console.log('User name:', userData.name);
    console.log('User email:', userData.email);

    // Bug: Calling a method that expects resolved data
    const processedData = await processData(userData); // This will fail

    return processedData;
  } catch (error) {
    console.error('Failed to process user data:', error);
    // Bug: Not re-throwing or handling the error properly
  }
}

function processData(data) {
  // This function expects resolved data, not a Promise
  return {
    id: data.id,
    fullName: `${data.firstName} ${data.lastName}`,
    isActive: data.status === 'active'
  };
}

// Bug: Calling async function without await in non-async context
const result = processUserData(123); // This returns a Promise, not the result
console.log('Final result:', result); // Will log "Promise { <pending> }"
