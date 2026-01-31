import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createTestFixture, withCwd } from '../test-helpers.js';
import { checkCoverage } from '../../scripts/checkers/coverage-checker.js';

describe('coverage-checker', () => {
  describe('Jest/Vitest coverage', () => {
    test('reads Jest coverage-summary.json', async () => {
      const coverageSummary = {
        total: {
          lines: { total: 1000, covered: 925, pct: 92.5 },
          branches: { total: 200, covered: 177, pct: 88.5 },
          functions: { total: 150, covered: 143, pct: 95.33 },
          statements: { total: 1050, covered: 971, pct: 92.48 }
        }
      };

      const fixture = await createTestFixture({
        'coverage/coverage-summary.json': JSON.stringify(coverageSummary)
      });

      await withCwd(fixture.dir, async () => {
        const result = await checkCoverage({ detected: ['javascript'], primary: 'javascript' }, 90);
        assert.strictEqual(result.available, true);
        assert.ok(result.tools_found.includes('jest'));
        assert.strictEqual(result.coverage.lines.percentage, 92.5);
        assert.strictEqual(result.meets_threshold, true);
      });

      await fixture.cleanup();
    });

    test('checks coverage against threshold', async () => {
      const coverageSummary = {
        total: {
          lines: { total: 100, covered: 85, pct: 85 },
          branches: { total: 50, covered: 40, pct: 80 },
          functions: { total: 20, covered: 18, pct: 90 },
          statements: { total: 100, covered: 85, pct: 85 }
        }
      };

      const fixture = await createTestFixture({
        'coverage/coverage-summary.json': JSON.stringify(coverageSummary)
      });

      await withCwd(fixture.dir, async () => {
        const result = await checkCoverage({ detected: ['javascript'], primary: 'javascript' }, 90);
        assert.strictEqual(result.meets_threshold, false); // 85% < 90%
        assert.strictEqual(result.threshold, 90);
      });

      await fixture.cleanup();
    });
  });

  describe('JaCoCo coverage', () => {
    test('parses JaCoCo XML report', async () => {
      const jacocoXml = `<?xml version="1.0" encoding="UTF-8"?>
<report>
  <counter type="INSTRUCTION" missed="100" covered="900"/>
  <counter type="BRANCH" missed="20" covered="80"/>
  <counter type="LINE" missed="50" covered="450"/>
  <counter type="COMPLEXITY" missed="10" covered="90"/>
  <counter type="METHOD" missed="5" covered="95"/>
  <counter type="CLASS" missed="2" covered="48"/>
</report>`;

      const fixture = await createTestFixture({
        'target/site/jacoco/jacoco.xml': jacocoXml
      });

      await withCwd(fixture.dir, async () => {
        const result = await checkCoverage({ detected: ['java'], primary: 'java' }, 90);
        assert.strictEqual(result.available, true);
        assert.ok(result.tools_found.includes('jacoco'));
        assert.strictEqual(result.coverage.lines.percentage, 90); // 450/(450+50)
        assert.strictEqual(result.meets_threshold, true);
      });

      await fixture.cleanup();
    });
  });

  describe('Missing coverage', () => {
    test('reports no coverage files found', async () => {
      const fixture = await createTestFixture({
        'package.json': JSON.stringify({ name: 'test' })
      });

      await withCwd(fixture.dir, async () => {
        const result = await checkCoverage({ detected: ['javascript'], primary: 'javascript' }, 90);
        assert.strictEqual(result.available, false);
        assert.deepStrictEqual(result.tools_found, []);
        assert.strictEqual(result.coverage, null);
      });

      await fixture.cleanup();
    });
  });
});
