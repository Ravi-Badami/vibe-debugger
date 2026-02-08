// null-error.js - Demonstrates common null reference error
// This file contains intentional bugs to showcase Vibe Debugger

function processUserInput(input) {
    // Bug: No null check before accessing properties
    const userName = input.name; // Will throw if input is null
    const userAge = input.age;   // Will throw if input is null

    console.log(`Hello ${userName}, you are ${userAge} years old!`);

    // Bug: Calling method on potentially null value
    const message = input.getMessage(); // Will throw if input is null
    console.log(message);

    return {
        name: userName,
        age: userAge,
        message: message
    };
}

// Bug: Passing null to the function
const result = processUserInput(null); // This will cause the error
console.log('Result:', result);