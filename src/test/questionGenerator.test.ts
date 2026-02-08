import * as assert from 'assert';
import { QuestionGenerator } from '../../src/questionGenerator';
import { DebugContext } from '../../src/contextCapture';
import { Config } from '../../src/config';

suite('Config Test Suite', () => {
  test('should have correct default values', () => {
    const config = Config.getAll();

    assert.strictEqual(config.autoNotify, true);
    assert.strictEqual(config.notificationDelay, 10);
    assert.strictEqual(config.debugMode, false);
    assert.strictEqual(config.maxNotificationsPerHour, 5);
  });

  test('should validate numeric settings', () => {
    // Test that negative values are rejected
    const validatedValue = (Config as any).validateNumericSetting(-5, 'testSetting');
    assert.strictEqual(validatedValue, undefined); // Should return default
  });

  test('should provide type-safe getters', () => {
    assert.strictEqual(typeof Config.autoNotify, 'boolean');
    assert.strictEqual(typeof Config.notificationDelay, 'number');
    assert.strictEqual(typeof Config.debugMode, 'boolean');
    assert.strictEqual(typeof Config.maxNotificationsPerHour, 'number');
  });
});

suite('QuestionGenerator Test Suite', () => {
  let questionGenerator: QuestionGenerator;

  setup(() => {
    questionGenerator = new QuestionGenerator();
  });

  test('should generate question for null reference error', () => {
    const context: DebugContext = {
      error: {
        filePath: 'test.js',
        line: 10,
        message: "Cannot read property 'length' of null",
        severity: 'Error',
        firstDetected: Date.now(),
        lastSeen: Date.now(),
        hasPersisted: false,
        fileChangedWhileError: false
      },
      fileName: 'test.js',
      fileContent: 'const str = null;\nconsole.log(str.length);',
      errorLine: 10,
      surroundingCode: 'const str = null;\nconsole.log(str.length);',
      recentChanges: [],
      language: 'javascript',
      timestamp: new Date()
    };

    const result = questionGenerator.generateQuestion(context);

    assert.strictEqual(result.errorCategory, 'null-undefined');
    assert.ok(result.question.includes('length'));
  });

  test('should generate question for undefined variable', () => {
    const context: DebugContext = {
      error: {
        filePath: 'test.js',
        line: 5,
        message: 'userData is not defined',
        severity: 'Error',
        firstDetected: Date.now(),
        lastSeen: Date.now(),
        hasPersisted: false,
        fileChangedWhileError: false
      },
      fileName: 'test.js',
      fileContent: 'console.log(userData.name);',
      errorLine: 5,
      surroundingCode: 'console.log(userData.name);',
      recentChanges: [],
      language: 'javascript',
      timestamp: new Date()
    };

    const result = questionGenerator.generateQuestion(context);

    assert.strictEqual(result.errorCategory, 'scope');
    assert.ok(result.question.includes('userData'));
  });

  test('should generate fallback question for unknown error', () => {
    const context: DebugContext = {
      error: {
        filePath: 'test.js',
        line: 1,
        message: 'Some unknown error occurred',
        severity: 'Error',
        firstDetected: Date.now(),
        lastSeen: Date.now(),
        hasPersisted: false,
        fileChangedWhileError: false
      },
      fileName: 'test.js',
      fileContent: 'someCode();',
      errorLine: 1,
      surroundingCode: 'someCode();',
      recentChanges: [],
      language: 'javascript',
      timestamp: new Date()
    };

    const result = questionGenerator.generateQuestion(context);

    assert.strictEqual(result.errorCategory, 'general');
    assert.ok(result.question.includes('What should happen instead'));
  });
});
