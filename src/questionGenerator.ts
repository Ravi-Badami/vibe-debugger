// Question Generator module - Enhanced version
import { DebugContext } from './contextCapture';

export interface QuestionData {
  question: string;
  errorCategory: string;
  suggestedAnswerFormat: string;
}

export class QuestionGenerator {
  generateQuestion(context: DebugContext): QuestionData {
    const errorMsg = context.error.message.toLowerCase();
    const code = context.surroundingCode;
    const language = context.language;

    // ==========================================
    // 1. NULL/UNDEFINED ERRORS
    // ==========================================
    if (
      errorMsg.includes('null') ||
      errorMsg.includes('undefined') ||
      errorMsg.includes('cannot read property') ||
      errorMsg.includes('cannot read properties')
    ) {
      const variable = this.extractVariableFromError(errorMsg, code);
      const property = this.extractPropertyFromError(errorMsg);

      if (property && variable) {
        return {
          question: `I see you're trying to access **${property}** from **${variable}**, but ${variable} is empty or doesn't exist yet.\n\n❓ **What should ${variable} contain before we access ${property}?**\n\n💡 *For example: "a user object with name and email" or "data from the login API"*`,
          errorCategory: 'null-undefined',
          suggestedAnswerFormat: 'Describe what this variable should hold'
        };
      } else if (variable) {
        return {
          question: `The variable **${variable}** is null or undefined when this code runs.\n\n❓ **What should ${variable} be at this point?**\n\n💡 *For example: "the logged-in user", "the clicked button element", "the fetched product data"*`,
          errorCategory: 'null-undefined',
          suggestedAnswerFormat: 'Describe the expected value'
        };
      } else {
        return {
          question: `Something is **null or undefined** that your code needs.\n\n❓ **What were you trying to access or use here?**\n\n💡 *For example: "user's profile picture URL", "the email input field value", "response from the API"*`,
          errorCategory: 'null-undefined',
          suggestedAnswerFormat: 'Describe what you were trying to access'
        };
      }
    }

    // ==========================================
    // 2. FUNCTION/METHOD NOT FOUND
    // ==========================================
    if (errorMsg.includes('is not a function') || errorMsg.includes('is not defined')) {
      const functionName = this.extractFunctionFromError(errorMsg, code);

      if (functionName) {
        return {
          question: `You're calling **${functionName}()** but it doesn't exist or isn't recognized.\n\n❓ **What should ${functionName}() do?**\n\n💡 *For example: "save the form data to database", "calculate the total price with tax", "open the confirmation popup"*`,
          errorCategory: 'function',
          suggestedAnswerFormat: 'Describe what should happen when this runs'
        };
      } else {
        return {
          question: `You're trying to call a function that doesn't exist.\n\n❓ **What action were you trying to perform?**\n\n💡 *For example: "submit the contact form", "filter products by category", "toggle the mobile menu"*`,
          errorCategory: 'function',
          suggestedAnswerFormat: 'Describe the action you wanted'
        };
      }
    }

    // ==========================================
    // 3. IMPORT/MODULE ERRORS
    // ==========================================
    if (
      errorMsg.includes('cannot find module') ||
      errorMsg.includes('module not found') ||
      errorMsg.includes('no such file') ||
      errorMsg.includes('failed to resolve')
    ) {
      const moduleName = this.extractModuleFromError(errorMsg);

      if (moduleName) {
        return {
          question: `The import **${moduleName}** can't be found.\n\n❓ **What does ${moduleName} do in your project?**\n\n💡 *For example: "handles user authentication", "provides date formatting utilities", "contains the Header component"*`,
          errorCategory: 'import',
          suggestedAnswerFormat: 'Describe what this import should provide'
        };
      } else {
        return {
          question: `There's a missing import or file.\n\n❓ **What functionality were you trying to use?**\n\n💡 *For example: "a date formatting library like moment", "my custom Button component", "API helper functions"*`,
          errorCategory: 'import',
          suggestedAnswerFormat: 'Describe what you need to import'
        };
      }
    }

    // ==========================================
    // 4. ASYNC/PROMISE ERRORS
    // ==========================================
    if (
      errorMsg.includes('await') ||
      errorMsg.includes('promise') ||
      errorMsg.includes('async') ||
      errorMsg.includes('.then') ||
      errorMsg.includes('unhandled rejection')
    ) {
      const operation = this.extractAsyncOperation(code);

      return {
        question: `You're waiting for something to finish${operation ? ` (${operation})` : ''}.\n\n❓ **What should happen AFTER it completes successfully?**\n\n💡 *For example: "display the fetched user data on the page", "redirect to the dashboard", "show a success notification"*`,
        errorCategory: 'async',
        suggestedAnswerFormat: 'Describe what should happen next'
      };
    }

    // ==========================================
    // 5. DOM/ELEMENT NOT FOUND
    // ==========================================
    if (
      errorMsg.includes('element') ||
      errorMsg.includes('getelementbyid') ||
      errorMsg.includes('queryselector') ||
      (code.toLowerCase().includes('document.') && errorMsg.includes('null'))
    ) {
      const elementId = this.extractElementFromCode(code);

      if (elementId) {
        return {
          question: `You're looking for an element called **${elementId}** on the page, but it's not found.\n\n❓ **What is this element supposed to be?**\n\n💡 *For example: "the submit button in the login form", "the username input field", "the div that shows error messages"*`,
          errorCategory: 'dom',
          suggestedAnswerFormat: 'Describe which element on the page'
        };
      } else {
        return {
          question: `You're trying to access an HTML element that doesn't exist yet.\n\n❓ **When should this element appear on the page?**\n\n💡 *For example: "immediately when page loads", "after user clicks the 'Show More' button", "after data is fetched from API"*`,
          errorCategory: 'dom',
          suggestedAnswerFormat: 'Describe when this element should exist'
        };
      }
    }

    // ==========================================
    // 6. TYPE ERRORS (TypeScript)
    // ==========================================
    if (
      errorMsg.includes('type') &&
      (errorMsg.includes('expected') || errorMsg.includes('assignable')) &&
      language === 'typescript'
    ) {
      return {
        question: `TypeScript found a type mismatch - the data type you're providing doesn't match what's expected.\n\n❓ **What kind of data should this be?**\n\n💡 *For example: "a number like age or price", "a text string like username", "an array of product objects", "true or false (boolean)"*`,
        errorCategory: 'type',
        suggestedAnswerFormat: 'Describe the type of data'
      };
    }

    // ==========================================
    // 7. SYNTAX ERRORS
    // ==========================================
    if (
      errorMsg.includes('unexpected token') ||
      errorMsg.includes('unexpected end') ||
      (errorMsg.includes('expected') && !errorMsg.includes('type'))
    ) {
      const line = this.getLineContent(context.errorLine, code);

      return {
        question: `There's a syntax problem on this line:\n\`\`\`${language}\n${line}\n\`\`\`\n\n❓ **In plain English, what were you trying to do here?**\n\n💡 *For example: "create a variable to store the user's name", "check if age is greater than 18", "call the function to save data"*`,
        errorCategory: 'syntax',
        suggestedAnswerFormat: 'Describe what this line should do'
      };
    }

    // ==========================================
    // 8. EVENT HANDLER ERRORS
    // ==========================================
    if (
      code.includes('onclick') ||
      code.includes('addEventListener') ||
      code.includes('onChange') ||
      code.includes('onClick') ||
      errorMsg.includes('handler') ||
      errorMsg.includes('event')
    ) {
      return {
        question: `This code handles user interaction (click, type, submit, etc.).\n\n❓ **When the user interacts, what should happen?**\n\n💡 *For example: "submit the form and show loading", "toggle show/hide password", "add the product to cart", "validate the email format"*`,
        errorCategory: 'event',
        suggestedAnswerFormat: 'Describe what should happen on interaction'
      };
    }

    // ==========================================
    // 9. API/FETCH ERRORS
    // ==========================================
    if (
      code.toLowerCase().includes('fetch') ||
      code.toLowerCase().includes('api') ||
      code.toLowerCase().includes('axios') ||
      code.toLowerCase().includes('http') ||
      errorMsg.includes('network') ||
      errorMsg.includes('cors') ||
      errorMsg.includes('404') ||
      errorMsg.includes('500')
    ) {
      const endpoint = this.extractEndpointFromCode(code);

      return {
        question: `You're making a request${endpoint ? ` to **${endpoint}**` : ' to an API'}.\n\n❓ **What information do you expect to get back?**\n\n💡 *For example: "a list of all products with name and price", "the logged-in user's profile data", "success confirmation with order ID"*`,
        errorCategory: 'api',
        suggestedAnswerFormat: 'Describe what data you expect'
      };
    }

    // ==========================================
    // 10. CONDITIONAL/LOGIC ERRORS
    // ==========================================
    if (
      code.includes('if (') ||
      code.includes('if(') ||
      code.includes('else') ||
      code.includes('switch') ||
      code.includes('case')
    ) {
      const condition = this.extractConditionFromCode(code);

      return {
        question: `You have a condition${condition ? ` checking **${condition}**` : ' in your code'}.\n\n❓ **In simple words, what are you checking for?**\n\n💡 *For example: "if the user is logged in", "if the shopping cart has items", "if the password is at least 8 characters"*`,
        errorCategory: 'logic',
        suggestedAnswerFormat: 'Describe what condition you are checking'
      };
    }

    // ==========================================
    // 11. ARRAY/OBJECT ACCESS ERRORS
    // ==========================================
    if (
      errorMsg.includes('index') ||
      errorMsg.includes('length') ||
      (code.includes('[') && code.includes(']'))
    ) {
      return {
        question: `You're trying to access an item in an array or list.\n\n❓ **What should this array/list contain?**\n\n💡 *For example: "a list of user comments", "array of image URLs", "shopping cart items"*`,
        errorCategory: 'array-access',
        suggestedAnswerFormat: 'Describe what the array should contain'
      };
    }

    // ==========================================
    // FALLBACK: GENERAL ERROR
    // ==========================================
    return {
      question: `I see there's an error, but I need to understand what you were trying to do.\n\n❓ **What should this code accomplish?**\n\n💡 *For example: "display the user's profile information", "validate the form before submitting", "fetch products and show them in a grid"*`,
      errorCategory: 'general',
      suggestedAnswerFormat: 'Describe the overall goal of this code'
    };
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private extractVariableFromError(errorMsg: string, code: string): string | null {
    const patterns = [
      /cannot read propert(?:y|ies) ['"]([^'"]+)['"] of/i,
      /['"]([^'"]+)['"] is (null|undefined)/i,
      /variable ['"]([^'"]+)['"] is not defined/i,
      /([a-zA-Z_$][a-zA-Z0-9_$]*) is (null|undefined)/i
    ];

    for (const pattern of patterns) {
      const match = errorMsg.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Try to extract from code context
    const varPatterns = [
      /\b(let|const|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g,
      /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*[=]/g
    ];

    for (const pattern of varPatterns) {
      const matches = Array.from(code.matchAll(pattern));
      if (matches.length > 0) {
        const lastMatch = matches[matches.length - 1];
        return lastMatch[2] || lastMatch[1];
      }
    }

    return null;
  }

  private extractPropertyFromError(errorMsg: string): string | null {
    const match = errorMsg.match(/property ['"]([^'"]+)['"]/i);
    return match ? match[1] : null;
  }

  private extractFunctionFromError(errorMsg: string, code: string): string | null {
    const funcPatterns = [
      /['"]?([a-zA-Z_$][a-zA-Z0-9_$]*)['"]? is not a function/i,
      /function ['"]([^'"]+)['"]/i,
      /([a-zA-Z_$][a-zA-Z0-9_$]*) is not defined/i
    ];

    for (const pattern of funcPatterns) {
      const match = errorMsg.match(pattern);
      if (match) {
        return match[1];
      }
    }

    // Extract from code
    const codeFuncPatterns = [
      /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/,
      /const\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/,
      /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/
    ];

    for (const pattern of codeFuncPatterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractModuleFromError(errorMsg: string): string | null {
    const patterns = [
      /module ['"]([^'"]+)['"]/i,
      /cannot find ['"]([^'"]+)['"]/i,
      /failed to resolve ['"]([^'"]+)['"]/i
    ];

    for (const pattern of patterns) {
      const match = errorMsg.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractAsyncOperation(code: string): string | null {
    if (code.includes('fetch(')) return 'API call';
    if (code.includes('axios')) return 'API request';
    if (code.includes('setTimeout')) return 'timer/delay';
    if (code.includes('setInterval')) return 'repeated timer';
    if (code.includes('Promise')) return 'async operation';
    return null;
  }

  private extractElementFromCode(code: string): string | null {
    const elementPatterns = [
      /getElementById\s*\(\s*['"]([^'"]+)['"]/i,
      /querySelector\s*\(\s*['"]([^'"]+)['"]/i,
      /class\s*=\s*['"]([^'"]+)['"]/i,
      /id\s*=\s*['"]([^'"]+)['"]/i
    ];

    for (const pattern of elementPatterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractEndpointFromCode(code: string): string | null {
    const endpointPatterns = [
      /fetch\s*\(\s*['"`]([^'"`]+)['"`]/i,
      /axios\.\w+\s*\(\s*['"`]([^'"`]+)['"`]/i,
      /['"`](\/api\/[^'"`\s]+)['"`]/i,
      /['"`](https?:\/\/[^'"`\s]+)['"`]/i
    ];

    for (const pattern of endpointPatterns) {
      const match = code.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  private extractConditionFromCode(code: string): string | null {
    const conditionPatterns = [
      /if\s*\(\s*([^)]+)\)/i,
      /else\s+if\s*\(\s*([^)]+)\)/i,
      /switch\s*\(\s*([^)]+)\)/i
    ];

    for (const pattern of conditionPatterns) {
      const match = code.match(pattern);
      if (match) {
        const condition = match[1].trim();
        // Return simplified condition (max 50 chars)
        return condition.length > 50 ? condition.substring(0, 47) + '...' : condition;
      }
    }

    return null;
  }

  private getLineContent(lineNumber: number, code: string): string {
    const lines = code.split('\n');
    if (lineNumber >= 0 && lineNumber < lines.length) {
      return lines[lineNumber].trim();
    }
    return lines[0]?.trim() || '';
  }
}
