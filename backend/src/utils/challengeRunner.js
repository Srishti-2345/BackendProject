import vm from "vm";

const normalize = (value) => JSON.stringify(value);

const createContext = () => {
  const context = {
    module: { exports: {} },
    exports: {},
    console: {
      log: () => {},
    },
  };

  vm.createContext(context);
  return context;
};

export const runChallengeTests = ({
  code,
  functionName,
  testCases,
  timeout = 800,
}) => {
  const wrappedCode = `
${code}
if (typeof ${functionName} !== "undefined" && typeof module.exports === "object") {
  module.exports = ${functionName};
}
`;

  const context = createContext();
  const script = new vm.Script(wrappedCode);
  script.runInContext(context, { timeout });

  const exported = context.module.exports;
  if (typeof exported !== "function") {
    throw new Error(`Submitted code must export or define a function named "${functionName}"`);
  }

  const results = testCases.map((testCase, index) => {
    try {
      const actualOutput = exported(...testCase.input);
      const passed = normalize(actualOutput) === normalize(testCase.expectedOutput);

      return {
        index,
        passed,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput,
        explanation: testCase.explanation,
      };
    } catch (error) {
      return {
        index,
        passed: false,
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        error: error.message,
        explanation: testCase.explanation,
      };
    }
  });

  return {
    passed: results.every((item) => item.passed),
    results,
  };
};
