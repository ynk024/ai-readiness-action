import { fileExists, readJsonFile, readXmlFile } from '../utils/file-utils.js';

/**
 * Check test coverage
 * @param {Object} languages - Detected languages
 * @param {number} threshold - Coverage threshold percentage
 * @returns {Promise<Object>}
 */
export async function checkCoverage(languages, threshold = 90) {
  const toolsFound = [];
  let coverageData = null;
  let coverageFile = null;

  // Check for JavaScript/TypeScript coverage (Jest/Vitest)
  if (languages.detected.includes('javascript') || languages.detected.includes('typescript')) {
    // Try standard location
    if (await fileExists('coverage/coverage-summary.json')) {
      coverageFile = 'coverage/coverage-summary.json';
      const data = await readJsonFile(coverageFile);
      if (data && data.total) {
        toolsFound.push('jest'); // Could be Jest or Vitest, they use same format
        coverageData = parseJestCoverage(data);
      }
    }
    // Try Vitest-specific location
    else if (await fileExists('coverage/vitest/coverage-summary.json')) {
      coverageFile = 'coverage/vitest/coverage-summary.json';
      const data = await readJsonFile(coverageFile);
      if (data && data.total) {
        toolsFound.push('vitest');
        coverageData = parseJestCoverage(data);
      }
    }
  }

  // Check for Java coverage (JaCoCo)
  if (languages.detected.includes('java') && !coverageData) {
    if (await fileExists('target/site/jacoco/jacoco.xml')) {
      coverageFile = 'target/site/jacoco/jacoco.xml';
      const data = await readXmlFile(coverageFile);
      if (data && data.report) {
        toolsFound.push('jacoco');
        coverageData = parseJaCoCoCoverage(data);
      }
    }
  }

  if (!coverageData) {
    return {
      available: false,
      tools_found: [],
      coverage: null,
      meets_threshold: false,
      threshold,
      coverage_file: null
    };
  }

  // Check if meets threshold (use line coverage as primary metric)
  const meetsThreshold = coverageData.lines.percentage >= threshold;

  return {
    available: true,
    tools_found: toolsFound,
    coverage: coverageData,
    meets_threshold: meetsThreshold,
    threshold,
    coverage_file: coverageFile
  };
}

/**
 * Parse Jest/Vitest coverage summary
 * @param {Object} data - Coverage summary data
 * @returns {Object}
 */
function parseJestCoverage(data) {
  const { lines, branches, functions, statements } = data.total;

  return {
    lines: {
      total: lines.total,
      covered: lines.covered,
      percentage: lines.pct
    },
    branches: {
      total: branches.total,
      covered: branches.covered,
      percentage: branches.pct
    },
    functions: {
      total: functions.total,
      covered: functions.covered,
      percentage: functions.pct
    },
    statements: {
      total: statements.total,
      covered: statements.covered,
      percentage: statements.pct
    }
  };
}

/**
 * Parse JaCoCo XML coverage report
 * @param {Object} data - Parsed XML data
 * @returns {Object}
 */
function parseJaCoCoCoverage(data) {
  const counters = data.report.counter || [];
  
  // Find the different counter types
  const lineCounter = counters.find(c => c.$.type === 'LINE');
  const branchCounter = counters.find(c => c.$.type === 'BRANCH');
  const methodCounter = counters.find(c => c.$.type === 'METHOD');
  const instructionCounter = counters.find(c => c.$.type === 'INSTRUCTION');

  const calculatePercentage = (counter) => {
    if (!counter) return 0;
    const missed = parseInt(counter.$.missed, 10);
    const covered = parseInt(counter.$.covered, 10);
    const total = missed + covered;
    return total > 0 ? parseFloat(((covered / total) * 100).toFixed(2)) : 0;
  };

  const getCounterStats = (counter) => {
    if (!counter) return { total: 0, covered: 0, percentage: 0 };
    const missed = parseInt(counter.$.missed, 10);
    const covered = parseInt(counter.$.covered, 10);
    return {
      total: missed + covered,
      covered,
      percentage: calculatePercentage(counter)
    };
  };

  return {
    lines: getCounterStats(lineCounter),
    branches: getCounterStats(branchCounter),
    functions: getCounterStats(methodCounter),
    statements: getCounterStats(instructionCounter)
  };
}
