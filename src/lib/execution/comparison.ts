/**
 * Type-Aware Output Comparison Utility
 * Evaluates function return values against expected test case outputs.
 * Supports booleans, integers, floats with tolerance, strings, arrays, and nested objects.
 */

export interface ComparisonOptions {
  returnType?: string;
  floatTolerance?: number;
  ignoreArrayOrder?: boolean;
  trimStrings?: boolean;
}

export interface ComparisonResult {
  passed: boolean;
  actualNormalized: any;
  expectedNormalized: any;
  message?: string;
  actualType: string;
  expectedType: string;
}

/**
 * Safely parse a value if it is serialized as a JSON string
 */
export function tryParseJson(value: any): any {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (trimmed === '') return value;

  // Check common boolean strings
  if (trimmed.toLowerCase() === 'true') return true;
  if (trimmed.toLowerCase() === 'false') return false;
  if (trimmed.toLowerCase() === 'none' || trimmed.toLowerCase() === 'null') return null;

  // Check valid JSON numbers, arrays, or objects
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(trimmed) || trimmed.startsWith('[') || trimmed.startsWith('{') || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  return value;
}

/**
 * Detect runtime data type name
 */
export function getTypeName(val: any): string {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Array.isArray(val)) return 'array';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'integer' : 'float';
  }
  return typeof val;
}

/**
 * Perform type-aware comparison between actual returned value and expected test case output
 */
export function compareValues(
  actualRaw: any,
  expectedRaw: any,
  options: ComparisonOptions = {}
): ComparisonResult {
  const tolerance = options.floatTolerance ?? 1e-6;

  // 1. Normalize both actual and expected values
  let actual = tryParseJson(actualRaw);
  let expected = tryParseJson(expectedRaw);

  const actualType = getTypeName(actual);
  const expectedType = getTypeName(expected);

  // If returnType is explicitly specified, enforce type coercion/validation
  const expectedTargetType = (options.returnType || '').toLowerCase().trim();

  // Handle Missing Return Value (None / undefined)
  if (actual === undefined || (actual === null && expectedTargetType && expectedTargetType !== 'null' && expectedTargetType !== 'void')) {
    if (expected !== null && expected !== undefined) {
      return {
        passed: false,
        actualNormalized: actual,
        expectedNormalized: expected,
        actualType,
        expectedType,
        message: 'Function did not return a value (returned None/null).'
      };
    }
  }

  // 2. Boolean Comparison
  // Critical requirement: Do not mistake False for missing return value or 0
  if (expectedTargetType === 'boolean' || typeof expected === 'boolean' || typeof actual === 'boolean') {
    const isActualBool = typeof actual === 'boolean';
    const isExpectedBool = typeof expected === 'boolean';

    if (!isActualBool || !isExpectedBool) {
      return {
        passed: false,
        actualNormalized: actual,
        expectedNormalized: expected,
        actualType,
        expectedType,
        message: `Type mismatch: expected boolean (${expected}), but got ${actualType} (${String(actual)})`
      };
    }

    return {
      passed: actual === expected,
      actualNormalized: actual,
      expectedNormalized: expected,
      actualType: 'boolean',
      expectedType: 'boolean',
      message: actual === expected ? undefined : `Expected ${expected}, but got ${actual}`
    };
  }

  // 3. Number Comparison (Integer / Float)
  if (typeof actual === 'number' && typeof expected === 'number') {
    // If floating point or tolerance required
    if (!Number.isInteger(actual) || !Number.isInteger(expected) || expectedTargetType === 'float' || expectedTargetType === 'double') {
      const diff = Math.abs(actual - expected);
      const passed = diff <= tolerance || (Number.isNaN(actual) && Number.isNaN(expected));
      return {
        passed,
        actualNormalized: actual,
        expectedNormalized: expected,
        actualType,
        expectedType,
        message: passed ? undefined : `Float mismatch: expected ${expected}, got ${actual} (diff: ${diff.toExponential(2)} > tol: ${tolerance})`
      };
    }

    // Integer equality
    return {
      passed: actual === expected,
      actualNormalized: actual,
      expectedNormalized: expected,
      actualType: 'integer',
      expectedType: 'integer',
      message: actual === expected ? undefined : `Expected ${expected}, but got ${actual}`
    };
  }

  // 4. String Comparison
  if (typeof actual === 'string' && typeof expected === 'string') {
    const aStr = options.trimStrings ? actual.trim() : actual;
    const eStr = options.trimStrings ? expected.trim() : expected;
    const passed = aStr === eStr;
    return {
      passed,
      actualNormalized: aStr,
      expectedNormalized: eStr,
      actualType: 'string',
      expectedType: 'string',
      message: passed ? undefined : `Expected "${eStr}", but got "${aStr}"`
    };
  }

  // 5. Array / List Comparison
  if (Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) {
      return {
        passed: false,
        actualNormalized: actual,
        expectedNormalized: expected,
        actualType: 'array',
        expectedType: 'array',
        message: `Array length mismatch: expected ${expected.length} elements, got ${actual.length}`
      };
    }

    if (options.ignoreArrayOrder) {
      // Sort and compare if array order is not significant
      const sortFn = (a: any, b: any) => JSON.stringify(a).localeCompare(JSON.stringify(b));
      const sortedActual = [...actual].sort(sortFn);
      const sortedExpected = [...expected].sort(sortFn);

      for (let i = 0; i < sortedActual.length; i++) {
        const itemComp = compareValues(sortedActual[i], sortedExpected[i], options);
        if (!itemComp.passed) {
          return {
            passed: false,
            actualNormalized: actual,
            expectedNormalized: expected,
            actualType: 'array',
            expectedType: 'array',
            message: `Element mismatch at index ${i}: ${itemComp.message}`
          };
        }
      }
    } else {
      for (let i = 0; i < actual.length; i++) {
        const itemComp = compareValues(actual[i], expected[i], options);
        if (!itemComp.passed) {
          return {
            passed: false,
            actualNormalized: actual,
            expectedNormalized: expected,
            actualType: 'array',
            expectedType: 'array',
            message: `Element mismatch at index [${i}]: ${itemComp.message || `expected ${JSON.stringify(expected[i])}, got ${JSON.stringify(actual[i])}`}`
          };
        }
      }
    }

    return {
      passed: true,
      actualNormalized: actual,
      expectedNormalized: expected,
      actualType: 'array',
      expectedType: 'array'
    };
  }

  // 6. Object / Dictionary Comparison
  if (typeof actual === 'object' && actual !== null && typeof expected === 'object' && expected !== null) {
    const actualKeys = Object.keys(actual).sort();
    const expectedKeys = Object.keys(expected).sort();

    if (actualKeys.length !== expectedKeys.length) {
      return {
        passed: false,
        actualNormalized: actual,
        expectedNormalized: expected,
        actualType: 'object',
        expectedType: 'object',
        message: `Object key count mismatch: expected keys [${expectedKeys.join(', ')}], got [${actualKeys.join(', ')}]`
      };
    }

    for (const key of expectedKeys) {
      if (!(key in actual)) {
        return {
          passed: false,
          actualNormalized: actual,
          expectedNormalized: expected,
          actualType: 'object',
          expectedType: 'object',
          message: `Missing expected object key: "${key}"`
        };
      }
      const valComp = compareValues(actual[key], expected[key], options);
      if (!valComp.passed) {
        return {
          passed: false,
          actualNormalized: actual,
          expectedNormalized: expected,
          actualType: 'object',
          expectedType: 'object',
          message: `Value mismatch for key "${key}": ${valComp.message}`
        };
      }
    }

    return {
      passed: true,
      actualNormalized: actual,
      expectedNormalized: expected,
      actualType: 'object',
      expectedType: 'object'
    };
  }

  // 7. Fallback / Mixed Type
  const fallbackPassed = JSON.stringify(actual) === JSON.stringify(expected);
  return {
    passed: fallbackPassed,
    actualNormalized: actual,
    expectedNormalized: expected,
    actualType,
    expectedType,
    message: fallbackPassed ? undefined : `Expected ${JSON.stringify(expected)} (${expectedType}), but got ${JSON.stringify(actual)} (${actualType})`
  };
}
