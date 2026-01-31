import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createTestFixture, withCwd } from '../test-helpers.js';
import { main } from '../../scripts/index.js';

describe('integration', () => {
  test('complete flow for TypeScript project', async () => {
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {},
      devDependencies: {
        'typescript': '^5.0.0',
        'eslint': '^8.0.0',
        'prettier': '^3.0.0',
        'eslint-plugin-boundaries': '^4.0.0',
        'vitest': '^1.0.0'
      },
      prettier: {
        semi: false
      }
    };

    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext'
      }
    };

    const eslintConfig = {
      extends: ['eslint:recommended']
    };

    const coverageSummary = {
      total: {
        lines: { total: 100, covered: 95, pct: 95 },
        branches: { total: 50, covered: 48, pct: 96 },
        functions: { total: 20, covered: 19, pct: 95 },
        statements: { total: 100, covered: 95, pct: 95 }
      }
    };

    const fixture = await createTestFixture({
      'package.json': JSON.stringify(packageJson, null, 2),
      'tsconfig.json': JSON.stringify(tsConfig, null, 2),
      '.eslintrc.json': JSON.stringify(eslintConfig, null, 2),
      'AGENTS.md': '# AI Agents Documentation',
      'SKILLS.md': '# Skills',
      'docs/ai/SKILLS.md': '# More Skills',
      '.github/workflows/codeql.yml': `
name: CodeQL
on: [push]
jobs:
  analyze:
    runs-on: ubuntu-latest
`,
      'coverage/coverage-summary.json': JSON.stringify(coverageSummary, null, 2),
      'src/index.ts': 'console.log("test");'
    });

    await withCwd(fixture.dir, async () => {
      // Set environment variables
      process.env.GITHUB_REPOSITORY = 'test-org/test-repo';
      process.env.GITHUB_SHA = 'abc123def456';
      process.env.GITHUB_REF = 'refs/heads/main';
      process.env.GITHUB_RUN_ID = '123456';
      process.env.GITHUB_SERVER_URL = 'https://github.com';
      process.env.COVERAGE_THRESHOLD = '90';
      // No endpoint - will just log

      // Capture console output
      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      try {
        // This should complete without throwing
        await main();

        // Verify some key log messages
        const allLogs = logs.join('\n');
        assert.ok(allLogs.includes('Starting AI-Readiness check'));
        assert.ok(allLogs.includes('Detected languages'));
        assert.ok(allLogs.includes('typescript'));
        assert.ok(allLogs.includes('AI-Readiness check completed successfully'));
      } finally {
        console.log = originalLog;
      }
    });

    await fixture.cleanup();
  });

  test('complete flow for Java Maven project', async () => {
    const pomXml = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>test-app</artifactId>
  <version>1.0.0</version>
  
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-checkstyle-plugin</artifactId>
        <version>3.3.0</version>
      </plugin>
    </plugins>
  </build>
  
  <dependencies>
    <dependency>
      <groupId>com.tngtech.archunit</groupId>
      <artifactId>archunit</artifactId>
      <version>1.2.1</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`;

    const jacocoXml = `<?xml version="1.0" encoding="UTF-8"?>
<report>
  <counter type="LINE" missed="5" covered="95"/>
  <counter type="BRANCH" missed="4" covered="46"/>
  <counter type="METHOD" missed="1" covered="19"/>
  <counter type="INSTRUCTION" missed="5" covered="95"/>
</report>`;

    const fixture = await createTestFixture({
      'pom.xml': pomXml,
      'AGENTS.md': '# Agents',
      'target/site/jacoco/jacoco.xml': jacocoXml,
      'src/main/java/com/example/App.java': 'public class App {}'
    });

    await withCwd(fixture.dir, async () => {
      process.env.GITHUB_REPOSITORY = 'test-org/java-app';
      process.env.GITHUB_SHA = 'def789';
      process.env.GITHUB_REF = 'refs/heads/develop';
      process.env.GITHUB_RUN_ID = '789456';
      process.env.GITHUB_SERVER_URL = 'https://github.com';
      process.env.COVERAGE_THRESHOLD = '90';

      const logs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog(...args);
      };

      try {
        await main();

        const allLogs = logs.join('\n');
        assert.ok(allLogs.includes('Detected languages'));
        assert.ok(allLogs.includes('java'));
        assert.ok(allLogs.includes('completed successfully'));
      } finally {
        console.log = originalLog;
      }
    });

    await fixture.cleanup();
  });
});
