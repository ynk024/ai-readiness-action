import { detectLanguages } from './utils/language-detector.js';
import { checkDocumentation } from './checkers/documentation-checker.js';
import { checkFormatters } from './checkers/formatter-checker.js';
import { checkTypeChecking } from './checkers/type-checker.js';
import { checkLinting } from './checkers/linting-checker.js';
import { checkSAST } from './checkers/sast-checker.js';
import { checkArchitectureTests } from './checkers/architecture-checker.js';
import { checkCoverage } from './checkers/coverage-checker.js';
import { postResults } from './reporter.js';

/**
 * Gather repository metadata
 * @returns {Object}
 */
function gatherMetadata() {
  const repoName = process.env.GITHUB_REPOSITORY || 'unknown/unknown';
  const commitSha = process.env.GITHUB_SHA || 'unknown';
  const ref = process.env.GITHUB_REF || 'unknown';
  const runId = process.env.GITHUB_RUN_ID || 'unknown';
  const serverUrl = process.env.GITHUB_SERVER_URL || 'https://github.com';

  // Extract branch name from ref (refs/heads/main -> main)
  const branch = ref.replace('refs/heads/', '').replace('refs/tags/', '');

  return {
    repository: {
      name: repoName,
      url: `${serverUrl}/${repoName}`,
      commit_sha: commitSha,
      branch: branch,
      run_id: runId,
      run_url: `${serverUrl}/${repoName}/actions/runs/${runId}`
    },
    timestamp: new Date().toISOString(),
    workflow_version: '1.0.0'
  };
}

/**
 * Main entry point
 */
async function main() {
  try {
    console.log('Starting AI-Readiness check...');

    // Gather metadata
    const metadata = gatherMetadata();
    console.log(`Checking repository: ${metadata.repository.name}`);

    // Detect languages
    console.log('Detecting languages...');
    const languages = await detectLanguages();
    console.log(`Detected languages: ${languages.detected.join(', ') || 'none'}`);
    if (languages.primary) {
      console.log(`Primary language: ${languages.primary}`);
    }

    // Run all checks
    console.log('Running checks...');
    const [
      documentation,
      formatters,
      typeChecking,
      linting,
      sast,
      architecture,
      coverage
    ] = await Promise.all([
      checkDocumentation(),
      checkFormatters(languages),
      checkTypeChecking(languages),
      checkLinting(languages),
      checkSAST(),
      checkArchitectureTests(languages),
      checkCoverage(languages, parseInt(process.env.COVERAGE_THRESHOLD || '90', 10))
    ]);

    // Build report
    const report = {
      metadata,
      languages,
      checks: {
        documentation,
        formatters,
        type_checking: typeChecking,
        linting,
        sast,
        architecture_tests: architecture,
        test_coverage: coverage
      }
    };

    // Post results
    const endpoint = process.env.ENDPOINT_URL;
    const token = process.env.ENDPOINT_TOKEN;

    console.log('Posting results...');
    await postResults(report, endpoint, token);

    console.log('AI-Readiness check completed successfully');
    process.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.error(error.stack);
    // Still exit 0 to not fail CI
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
