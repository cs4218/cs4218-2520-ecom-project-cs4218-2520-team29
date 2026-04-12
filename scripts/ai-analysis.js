import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';

const API_KEY = process.env.OPENAI_API_KEY;

if (!API_KEY) {
  console.error('Missing OPENAI_API_KEY environment variable.');
  process.exit(1);
}

const filePath = 'jest-results.json';

if (!fs.existsSync(filePath)) {
  console.error(`${filePath} not found. Run Jest first with: npx jest --json --outputFile=jest-results.json`);
  process.exit(1);
}

const raw = fs.readFileSync(filePath, 'utf8');
const results = JSON.parse(raw);

const summary = {
  totalTestSuites: results.numTotalTestSuites ?? 0,
  passedTestSuites: results.numPassedTestSuites ?? 0,
  failedTestSuites: results.numFailedTestSuites ?? 0,
  totalTests: results.numTotalTests ?? 0,
  passedTests: results.numPassedTests ?? 0,
  failedTests: results.numFailedTests ?? 0,
};

const failedTests = (results.testResults || []).flatMap((suite) =>
  (suite.assertionResults || [])
    .filter((test) => test.status === 'failed')
    .map((test) => ({
      file: suite.name,
      testName: test.fullName,
      error: (test.failureMessages || []).join('\n'),
    }))
);

if (failedTests.length === 0) {
  fs.writeFileSync(
    'ai-summary.md',
    `# AI Test Analysis

## Test Summary
- Total test suites: ${summary.totalTestSuites}
- Passed test suites: ${summary.passedTestSuites}
- Failed test suites: ${summary.failedTestSuites}
- Total tests: ${summary.totalTests}
- Passed tests: ${summary.passedTests}
- Failed tests: ${summary.failedTests}

## Result
No failed tests were found.
`,
    'utf8'
  );
  console.log('No failed tests found. Wrote ai-summary.md');
  process.exit(0);
}

const prompt = `
You are a software testing assistant for a MERN e-commerce project.

Given the Jest test summary and failed test cases below, do the following:

1. Summarize the failures clearly.
2. Identify the most likely root causes.
3. Suggest missing test cases, including edge cases, validation scenarios, and error-handling paths.
4. Provide 3 to 5 new Jest or Playwright test ideas.
5. Optionally generate short test skeleton code for the most important suggested test.

Keep the response structured with clear headings.

## Test Summary
${JSON.stringify(summary, null, 2)}

## Failed Test Cases
${JSON.stringify(failedTests, null, 2)}
`;

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.2,
  }),
});

const data = await response.json();

if (!response.ok) {
  console.error('OpenAI API request failed.');
  console.error('Status:', response.status);
  console.error('Response:', JSON.stringify(data, null, 2));
  process.exit(1);
}

const output = data?.choices?.[0]?.message?.content;

if (!output) {
  console.error('OpenAI response did not contain choices[0].message.content');
  console.error('Response:', JSON.stringify(data, null, 2));
  process.exit(1);
}

fs.writeFileSync('ai-summary.md', output, 'utf8');
console.log('AI analysis saved to ai-summary.md');