import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createTestFixture, withCwd } from '../test-helpers.js';
import { parseGradleBuild, hasGradlePlugin, hasGradleDependency } from '../../scripts/utils/gradle-parser.js';

describe('gradle-parser', () => {
  describe('parseGradleBuild', () => {
    test('parses build.gradle file', async () => {
      const buildContent = `
plugins {
    id 'java'
    id 'checkstyle'
}

group = 'com.example'
version = '1.0.0'
`;

      const fixture = await createTestFixture({
        'build.gradle': buildContent
      });

      await withCwd(fixture.dir, async () => {
        const result = await parseGradleBuild();
        assert.ok(result);
        assert.strictEqual(result.content, buildContent);
      });

      await fixture.cleanup();
    });

    test('parses build.gradle.kts file', async () => {
      const buildContent = `
plugins {
    java
    id("checkstyle")
}
`;

      const fixture = await createTestFixture({
        'build.gradle.kts': buildContent
      });

      await withCwd(fixture.dir, async () => {
        const result = await parseGradleBuild();
        assert.ok(result);
        assert.strictEqual(result.content, buildContent);
      });

      await fixture.cleanup();
    });

    test('prefers build.gradle over build.gradle.kts', async () => {
      const fixture = await createTestFixture({
        'build.gradle': 'plugins { id "java" }',
        'build.gradle.kts': 'plugins { java }'
      });

      await withCwd(fixture.dir, async () => {
        const result = await parseGradleBuild();
        assert.ok(result.content.includes('id "java"'));
      });

      await fixture.cleanup();
    });

    test('returns null if no gradle file exists', async () => {
      const fixture = await createTestFixture({
        'pom.xml': '<?xml version="1.0"?><project></project>'
      });

      await withCwd(fixture.dir, async () => {
        const result = await parseGradleBuild();
        assert.strictEqual(result, null);
      });

      await fixture.cleanup();
    });
  });

  describe('hasGradlePlugin', () => {
    test('detects plugin with id syntax (Groovy)', async () => {
      const gradle = {
        content: `
plugins {
    id 'java'
    id 'checkstyle'
    id 'com.github.spotbugs' version '5.0.0'
}
`
      };

      assert.strictEqual(hasGradlePlugin(gradle, 'java'), true);
      assert.strictEqual(hasGradlePlugin(gradle, 'checkstyle'), true);
      assert.strictEqual(hasGradlePlugin(gradle, 'com.github.spotbugs'), true);
    });

    test('detects plugin with id syntax (Kotlin)', async () => {
      const gradle = {
        content: `
plugins {
    java
    id("checkstyle")
    id("com.diffplug.spotless") version "6.0.0"
}
`
      };

      assert.strictEqual(hasGradlePlugin(gradle, 'java'), true);
      assert.strictEqual(hasGradlePlugin(gradle, 'checkstyle'), true);
      assert.strictEqual(hasGradlePlugin(gradle, 'com.diffplug.spotless'), true);
    });

    test('detects apply plugin syntax', async () => {
      const gradle = {
        content: `
apply plugin: 'java'
apply plugin: 'checkstyle'
`
      };

      assert.strictEqual(hasGradlePlugin(gradle, 'java'), true);
      assert.strictEqual(hasGradlePlugin(gradle, 'checkstyle'), true);
    });

    test('returns false for non-existent plugin', async () => {
      const gradle = {
        content: `
plugins {
    id 'java'
}
`
      };

      assert.strictEqual(hasGradlePlugin(gradle, 'checkstyle'), false);
    });

    test('returns false for null gradle', async () => {
      assert.strictEqual(hasGradlePlugin(null, 'java'), false);
    });
  });

  describe('hasGradleDependency', () => {
    test('detects dependencies (Groovy syntax)', async () => {
      const gradle = {
        content: `
dependencies {
    testImplementation 'com.tngtech.archunit:archunit:1.2.1'
    implementation 'org.springframework.boot:spring-boot-starter-web'
}
`
      };

      assert.strictEqual(hasGradleDependency(gradle, 'com.tngtech.archunit', 'archunit'), true);
      assert.strictEqual(hasGradleDependency(gradle, 'org.springframework.boot', 'spring-boot-starter-web'), true);
    });

    test('detects dependencies (Kotlin syntax)', async () => {
      const gradle = {
        content: `
dependencies {
    testImplementation("com.tngtech.archunit:archunit:1.2.1")
    implementation("org.springframework.boot:spring-boot-starter-web")
}
`
      };

      assert.strictEqual(hasGradleDependency(gradle, 'com.tngtech.archunit', 'archunit'), true);
      assert.strictEqual(hasGradleDependency(gradle, 'org.springframework.boot', 'spring-boot-starter-web'), true);
    });

    test('works with just artifact id', async () => {
      const gradle = {
        content: `
dependencies {
    testImplementation 'com.tngtech.archunit:archunit:1.2.1'
}
`
      };

      assert.strictEqual(hasGradleDependency(gradle, null, 'archunit'), true);
    });

    test('returns false for non-existent dependency', async () => {
      const gradle = {
        content: `
dependencies {
    implementation 'junit:junit:4.13'
}
`
      };

      assert.strictEqual(hasGradleDependency(gradle, 'com.tngtech.archunit', 'archunit'), false);
    });

    test('returns false for null gradle', async () => {
      assert.strictEqual(hasGradleDependency(null, 'group', 'artifact'), false);
    });
  });
});
