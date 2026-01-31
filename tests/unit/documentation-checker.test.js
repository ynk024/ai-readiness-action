import { describe, test } from 'node:test';
import assert from 'node:assert';
import { createTestFixture, withCwd } from '../test-helpers.js';
import { checkDocumentation } from '../../scripts/checkers/documentation-checker.js';

describe('documentation-checker', () => {
  test('finds AGENTS.md in root', async () => {
    const fixture = await createTestFixture({
      'AGENTS.md': '# Agents',
      'README.md': '# Project'
    });

    await withCwd(fixture.dir, async () => {
      const result = await checkDocumentation();
      assert.strictEqual(result.agents_md.present, true);
      assert.ok(result.agents_md.path.endsWith('AGENTS.md'));
    });

    await fixture.cleanup();
  });

  test('finds AGENTS.md in docs directory', async () => {
    const fixture = await createTestFixture({
      'docs/AGENTS.md': '# Agents'
    });

    await withCwd(fixture.dir, async () => {
      const result = await checkDocumentation();
      assert.strictEqual(result.agents_md.present, true);
      assert.ok(result.agents_md.path.includes('docs'));
    });

    await fixture.cleanup();
  });

  test('reports missing AGENTS.md', async () => {
    const fixture = await createTestFixture({
      'README.md': '# Project'
    });

    await withCwd(fixture.dir, async () => {
      const result = await checkDocumentation();
      assert.strictEqual(result.agents_md.present, false);
      assert.strictEqual(result.agents_md.path, null);
    });

    await fixture.cleanup();
  });

  test('finds multiple SKILLS.md files', async () => {
    const fixture = await createTestFixture({
      'SKILLS.md': '# Skills 1',
      'docs/ai/SKILLS.md': '# Skills 2',
      'skills/SKILLS.md': '# Skills 3'
    });

    await withCwd(fixture.dir, async () => {
      const result = await checkDocumentation();
      assert.strictEqual(result.skills_md.count, 3);
      assert.strictEqual(result.skills_md.paths.length, 3);
    });

    await fixture.cleanup();
  });

  test('reports no SKILLS.md files', async () => {
    const fixture = await createTestFixture({
      'AGENTS.md': '# Agents'
    });

    await withCwd(fixture.dir, async () => {
      const result = await checkDocumentation();
      assert.strictEqual(result.skills_md.count, 0);
      assert.deepStrictEqual(result.skills_md.paths, []);
    });

    await fixture.cleanup();
  });
});
