import { describe, test, before, after } from 'node:test';
import assert from 'node:assert';
import { createTestFixture, withCwd } from '../test-helpers.js';
import { detectLanguages } from '../../scripts/utils/language-detector.js';

describe('language-detector', () => {
  describe('detectLanguages', () => {
    test('detects JavaScript only project', async () => {
      const fixture = await createTestFixture({
        'package.json': JSON.stringify({ name: 'test' }),
        'index.js': 'console.log("test")',
      });

      await withCwd(fixture.dir, async () => {
        const result = await detectLanguages();
        assert.deepStrictEqual(result.detected, ['javascript']);
        assert.strictEqual(result.primary, 'javascript');
      });

      await fixture.cleanup();
    });

    test('detects TypeScript project', async () => {
      const fixture = await createTestFixture({
        'package.json': JSON.stringify({ name: 'test' }),
        'tsconfig.json': JSON.stringify({ compilerOptions: {} }),
        'index.ts': 'const x: string = "test"',
      });

      await withCwd(fixture.dir, async () => {
        const result = await detectLanguages();
        assert.ok(result.detected.includes('javascript'));
        assert.ok(result.detected.includes('typescript'));
        assert.strictEqual(result.primary, 'typescript');
      });

      await fixture.cleanup();
    });

    test('detects Java (Maven) project', async () => {
      const fixture = await createTestFixture({
        'pom.xml': '<?xml version="1.0"?><project></project>',
        'src/main/java/App.java': 'public class App {}',
      });

      await withCwd(fixture.dir, async () => {
        const result = await detectLanguages();
        assert.deepStrictEqual(result.detected, ['java']);
        assert.strictEqual(result.primary, 'java');
      });

      await fixture.cleanup();
    });

    test('detects Java (Gradle) project', async () => {
      const fixture = await createTestFixture({
        'build.gradle': 'plugins { id "java" }',
        'src/main/java/App.java': 'public class App {}',
      });

      await withCwd(fixture.dir, async () => {
        const result = await detectLanguages();
        assert.deepStrictEqual(result.detected, ['java']);
        assert.strictEqual(result.primary, 'java');
      });

      await fixture.cleanup();
    });

    test('detects Java (Gradle Kotlin DSL) project', async () => {
      const fixture = await createTestFixture({
        'build.gradle.kts': 'plugins { java }',
        'src/main/java/App.java': 'public class App {}',
      });

      await withCwd(fixture.dir, async () => {
        const result = await detectLanguages();
        assert.deepStrictEqual(result.detected, ['java']);
        assert.strictEqual(result.primary, 'java');
      });

      await fixture.cleanup();
    });

    test('detects monorepo with JavaScript and Java', async () => {
      const fixture = await createTestFixture({
        'package.json': JSON.stringify({ name: 'test' }),
        'pom.xml': '<?xml version="1.0"?><project></project>',
        'frontend/index.js': '',
        'backend/src/main/java/App.java': '',
      });

      await withCwd(fixture.dir, async () => {
        const result = await detectLanguages();
        assert.ok(result.detected.includes('javascript'));
        assert.ok(result.detected.includes('java'));
        // First detected becomes primary if no TypeScript
        assert.strictEqual(result.primary, 'javascript');
      });

      await fixture.cleanup();
    });

    test('detects monorepo with TypeScript and Java (TypeScript primary)', async () => {
      const fixture = await createTestFixture({
        'package.json': JSON.stringify({ name: 'test' }),
        'tsconfig.json': JSON.stringify({}),
        'pom.xml': '<?xml version="1.0"?><project></project>',
      });

      await withCwd(fixture.dir, async () => {
        const result = await detectLanguages();
        assert.ok(result.detected.includes('javascript'));
        assert.ok(result.detected.includes('typescript'));
        assert.ok(result.detected.includes('java'));
        assert.strictEqual(result.primary, 'typescript');
      });

      await fixture.cleanup();
    });

    test('returns empty for project with no recognized languages', async () => {
      const fixture = await createTestFixture({
        'README.md': '# Test',
        'data.csv': 'name,value\ntest,123',
      });

      await withCwd(fixture.dir, async () => {
        const result = await detectLanguages();
        assert.deepStrictEqual(result.detected, []);
        assert.strictEqual(result.primary, null);
      });

      await fixture.cleanup();
    });
  });
});
