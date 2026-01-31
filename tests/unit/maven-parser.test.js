import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createTestFixture, withCwd } from '../test-helpers.js';
import { parsePomXml, hasMavenPlugin, hasMavenDependency } from '../../scripts/utils/maven-parser.js';

describe('maven-parser', () => {
  describe('parsePomXml', () => {
    test('parses basic pom.xml', async () => {
      const pomContent = `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0">
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>my-app</artifactId>
  <version>1.0.0</version>
</project>`;

      const fixture = await createTestFixture({
        'pom.xml': pomContent
      });

      await withCwd(fixture.dir, async () => {
        const result = await parsePomXml();
        assert.ok(result);
        assert.ok(result.project);
      });

      await fixture.cleanup();
    });

    test('returns null if pom.xml does not exist', async () => {
      const fixture = await createTestFixture({
        'README.md': '# Test'
      });

      await withCwd(fixture.dir, async () => {
        const result = await parsePomXml();
        assert.strictEqual(result, null);
      });

      await fixture.cleanup();
    });

    test('parses pom.xml with plugins', async () => {
      const pomContent = `<?xml version="1.0"?>
<project>
  <build>
    <plugins>
      <plugin>
        <groupId>org.apache.maven.plugins</groupId>
        <artifactId>maven-checkstyle-plugin</artifactId>
        <version>3.3.0</version>
      </plugin>
    </plugins>
  </build>
</project>`;

      const fixture = await createTestFixture({
        'pom.xml': pomContent
      });

      await withCwd(fixture.dir, async () => {
        const result = await parsePomXml();
        assert.ok(result.project.build);
      });

      await fixture.cleanup();
    });

    test('parses pom.xml with dependencies', async () => {
      const pomContent = `<?xml version="1.0"?>
<project>
  <dependencies>
    <dependency>
      <groupId>com.tngtech.archunit</groupId>
      <artifactId>archunit</artifactId>
      <version>1.2.1</version>
      <scope>test</scope>
    </dependency>
  </dependencies>
</project>`;

      const fixture = await createTestFixture({
        'pom.xml': pomContent
      });

      await withCwd(fixture.dir, async () => {
        const result = await parsePomXml();
        assert.ok(result.project.dependencies);
      });

      await fixture.cleanup();
    });
  });

  describe('hasMavenPlugin', () => {
    test('returns true when plugin exists', async () => {
      const pom = {
        project: {
          build: [{
            plugins: [{
              plugin: [
                {
                  groupId: ['org.apache.maven.plugins'],
                  artifactId: ['maven-checkstyle-plugin']
                }
              ]
            }]
          }]
        }
      };

      const result = hasMavenPlugin(pom, 'maven-checkstyle-plugin');
      assert.strictEqual(result, true);
    });

    test('returns false when plugin does not exist', async () => {
      const pom = {
        project: {
          build: [{
            plugins: [{
              plugin: [
                {
                  groupId: ['org.apache.maven.plugins'],
                  artifactId: ['maven-compiler-plugin']
                }
              ]
            }]
          }]
        }
      };

      const result = hasMavenPlugin(pom, 'maven-checkstyle-plugin');
      assert.strictEqual(result, false);
    });

    test('returns false for null pom', async () => {
      const result = hasMavenPlugin(null, 'maven-checkstyle-plugin');
      assert.strictEqual(result, false);
    });

    test('returns false when no plugins section', async () => {
      const pom = {
        project: {
          dependencies: []
        }
      };

      const result = hasMavenPlugin(pom, 'maven-checkstyle-plugin');
      assert.strictEqual(result, false);
    });
  });

  describe('hasMavenDependency', () => {
    test('returns true when dependency exists', async () => {
      const pom = {
        project: {
          dependencies: [{
            dependency: [
              {
                groupId: ['com.tngtech.archunit'],
                artifactId: ['archunit']
              }
            ]
          }]
        }
      };

      const result = hasMavenDependency(pom, 'archunit');
      assert.strictEqual(result, true);
    });

    test('returns false when dependency does not exist', async () => {
      const pom = {
        project: {
          dependencies: [{
            dependency: [
              {
                groupId: ['junit'],
                artifactId: ['junit']
              }
            ]
          }]
        }
      };

      const result = hasMavenDependency(pom, 'archunit');
      assert.strictEqual(result, false);
    });

    test('returns false for null pom', async () => {
      const result = hasMavenDependency(null, 'archunit');
      assert.strictEqual(result, false);
    });

    test('returns false when no dependencies section', async () => {
      const pom = {
        project: {
          build: []
        }
      };

      const result = hasMavenDependency(pom, 'archunit');
      assert.strictEqual(result, false);
    });
  });
});
