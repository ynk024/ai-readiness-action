import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createTestFixture, withCwd } from '../test-helpers.js';
import { getPackageJson, hasDependency, getDependencyVersion } from '../../scripts/utils/package-parser.js';

describe('package-parser', () => {
  describe('getPackageJson', () => {
    test('reads and returns package.json content', async () => {
      const packageData = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          'express': '^4.18.0'
        },
        devDependencies: {
          'jest': '^29.0.0'
        }
      };

      const fixture = await createTestFixture({
        'package.json': JSON.stringify(packageData, null, 2)
      });

      await withCwd(fixture.dir, async () => {
        const result = await getPackageJson();
        assert.deepStrictEqual(result, packageData);
      });

      await fixture.cleanup();
    });

    test('returns null if package.json does not exist', async () => {
      const fixture = await createTestFixture({
        'README.md': '# Test'
      });

      await withCwd(fixture.dir, async () => {
        const result = await getPackageJson();
        assert.strictEqual(result, null);
      });

      await fixture.cleanup();
    });

    test('handles package.json with prettier config', async () => {
      const packageData = {
        name: 'test',
        prettier: {
          semi: false,
          singleQuote: true
        }
      };

      const fixture = await createTestFixture({
        'package.json': JSON.stringify(packageData)
      });

      await withCwd(fixture.dir, async () => {
        const result = await getPackageJson();
        assert.ok(result.prettier);
        assert.strictEqual(result.prettier.semi, false);
      });

      await fixture.cleanup();
    });

    test('handles package.json with eslintConfig', async () => {
      const packageData = {
        name: 'test',
        eslintConfig: {
          extends: ['eslint:recommended']
        }
      };

      const fixture = await createTestFixture({
        'package.json': JSON.stringify(packageData)
      });

      await withCwd(fixture.dir, async () => {
        const result = await getPackageJson();
        assert.ok(result.eslintConfig);
      });

      await fixture.cleanup();
    });
  });

  describe('hasDependency', () => {
    test('returns true for dependency in dependencies', async () => {
      const packageData = {
        name: 'test',
        dependencies: {
          'express': '^4.18.0',
          'lodash': '^4.17.21'
        }
      };

      const result = hasDependency(packageData, 'express');
      assert.strictEqual(result, true);
    });

    test('returns true for dependency in devDependencies', async () => {
      const packageData = {
        name: 'test',
        devDependencies: {
          'jest': '^29.0.0',
          'eslint': '^8.0.0'
        }
      };

      const result = hasDependency(packageData, 'jest');
      assert.strictEqual(result, true);
    });

    test('returns true when present in both dependencies and devDependencies', async () => {
      const packageData = {
        name: 'test',
        dependencies: {
          'typescript': '^5.0.0'
        },
        devDependencies: {
          'typescript': '^5.0.0'
        }
      };

      const result = hasDependency(packageData, 'typescript');
      assert.strictEqual(result, true);
    });

    test('returns false for non-existent dependency', async () => {
      const packageData = {
        name: 'test',
        dependencies: {
          'express': '^4.18.0'
        }
      };

      const result = hasDependency(packageData, 'nonexistent');
      assert.strictEqual(result, false);
    });

    test('returns false for null package.json', async () => {
      const result = hasDependency(null, 'express');
      assert.strictEqual(result, false);
    });

    test('returns false for package.json without dependencies', async () => {
      const packageData = {
        name: 'test',
        version: '1.0.0'
      };

      const result = hasDependency(packageData, 'express');
      assert.strictEqual(result, false);
    });
  });

  describe('getDependencyVersion', () => {
    test('returns version from dependencies', async () => {
      const packageData = {
        name: 'test',
        dependencies: {
          'express': '^4.18.0'
        }
      };

      const version = getDependencyVersion(packageData, 'express');
      assert.strictEqual(version, '^4.18.0');
    });

    test('returns version from devDependencies', async () => {
      const packageData = {
        name: 'test',
        devDependencies: {
          'jest': '^29.5.0'
        }
      };

      const version = getDependencyVersion(packageData, 'jest');
      assert.strictEqual(version, '^29.5.0');
    });

    test('prefers dependencies over devDependencies', async () => {
      const packageData = {
        name: 'test',
        dependencies: {
          'typescript': '^5.0.0'
        },
        devDependencies: {
          'typescript': '^4.9.0'
        }
      };

      const version = getDependencyVersion(packageData, 'typescript');
      assert.strictEqual(version, '^5.0.0');
    });

    test('returns null for non-existent dependency', async () => {
      const packageData = {
        name: 'test',
        dependencies: {
          'express': '^4.18.0'
        }
      };

      const version = getDependencyVersion(packageData, 'nonexistent');
      assert.strictEqual(version, null);
    });

    test('returns null for null package.json', async () => {
      const version = getDependencyVersion(null, 'express');
      assert.strictEqual(version, null);
    });
  });
});
