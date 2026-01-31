import { describe, test, before, after } from 'node:test';
import assert from 'node:assert';
import { createTestFixture, withCwd } from '../test-helpers.js';
import { fileExists, findFiles, readJsonFile, readXmlFile, readFileContent } from '../../scripts/utils/file-utils.js';

describe('file-utils', () => {
  describe('fileExists', () => {
    let fixture;

    before(async () => {
      fixture = await createTestFixture({
        'test.txt': 'hello',
        'nested/file.js': 'console.log("test")',
      });
    });

    after(async () => {
      await fixture.cleanup();
    });

    test('returns true for existing file', async () => {
      await withCwd(fixture.dir, async () => {
        const exists = await fileExists('test.txt');
        assert.strictEqual(exists, true);
      });
    });

    test('returns true for nested existing file', async () => {
      await withCwd(fixture.dir, async () => {
        const exists = await fileExists('nested/file.js');
        assert.strictEqual(exists, true);
      });
    });

    test('returns false for non-existing file', async () => {
      await withCwd(fixture.dir, async () => {
        const exists = await fileExists('nonexistent.txt');
        assert.strictEqual(exists, false);
      });
    });

    test('returns false for directory', async () => {
      await withCwd(fixture.dir, async () => {
        const exists = await fileExists('nested');
        assert.strictEqual(exists, false);
      });
    });
  });

  describe('findFiles', () => {
    let fixture;

    before(async () => {
      fixture = await createTestFixture({
        'package.json': '{}',
        'src/index.js': '',
        'src/utils/helper.js': '',
        'tests/test.js': '',
        'SKILLS.md': '# Skills',
        'docs/ai/SKILLS.md': '# More Skills',
        'README.md': '# Readme',
      });
    });

    after(async () => {
      await fixture.cleanup();
    });

    test('finds all JavaScript files', async () => {
      await withCwd(fixture.dir, async () => {
        const files = await findFiles('**/*.js');
        assert.strictEqual(files.length, 3);
        assert.ok(files.some(f => f.endsWith('index.js')));
        assert.ok(files.some(f => f.endsWith('helper.js')));
        assert.ok(files.some(f => f.endsWith('test.js')));
      });
    });

    test('finds all SKILLS.md files', async () => {
      await withCwd(fixture.dir, async () => {
        const files = await findFiles('**/SKILLS.md');
        assert.strictEqual(files.length, 2);
      });
    });

    test('finds specific file in root', async () => {
      await withCwd(fixture.dir, async () => {
        const files = await findFiles('package.json');
        assert.strictEqual(files.length, 1);
        assert.ok(files[0].endsWith('package.json'));
      });
    });

    test('returns empty array for non-matching pattern', async () => {
      await withCwd(fixture.dir, async () => {
        const files = await findFiles('**/*.nonexistent');
        assert.strictEqual(files.length, 0);
      });
    });
  });

  describe('readJsonFile', () => {
    let fixture;

    before(async () => {
      fixture = await createTestFixture({
        'valid.json': JSON.stringify({ name: 'test', version: '1.0.0' }),
        'invalid.json': '{ invalid json }',
        'empty.json': '',
      });
    });

    after(async () => {
      await fixture.cleanup();
    });

    test('reads and parses valid JSON file', async () => {
      await withCwd(fixture.dir, async () => {
        const data = await readJsonFile('valid.json');
        assert.deepStrictEqual(data, { name: 'test', version: '1.0.0' });
      });
    });

    test('throws error for invalid JSON', async () => {
      await withCwd(fixture.dir, async () => {
        await assert.rejects(
          async () => await readJsonFile('invalid.json'),
          { name: 'SyntaxError' }
        );
      });
    });

    test('returns null for non-existent file', async () => {
      await withCwd(fixture.dir, async () => {
        const data = await readJsonFile('nonexistent.json');
        assert.strictEqual(data, null);
      });
    });

    test('throws error for empty JSON file', async () => {
      await withCwd(fixture.dir, async () => {
        await assert.rejects(
          async () => await readJsonFile('empty.json')
        );
      });
    });
  });

  describe('readXmlFile', () => {
    let fixture;

    before(async () => {
      fixture = await createTestFixture({
        'valid.xml': '<?xml version="1.0"?><root><item>test</item></root>',
        'invalid.xml': '<root><unclosed>',
        'empty.xml': '',
      });
    });

    after(async () => {
      await fixture.cleanup();
    });

    test('reads and parses valid XML file', async () => {
      await withCwd(fixture.dir, async () => {
        const data = await readXmlFile('valid.xml');
        assert.ok(data.root);
        assert.deepStrictEqual(data.root.item, ['test']);
      });
    });

    test('throws error for invalid XML', async () => {
      await withCwd(fixture.dir, async () => {
        await assert.rejects(
          async () => await readXmlFile('invalid.xml')
        );
      });
    });

    test('returns null for non-existent file', async () => {
      await withCwd(fixture.dir, async () => {
        const data = await readXmlFile('nonexistent.xml');
        assert.strictEqual(data, null);
      });
    });
  });

  describe('readFileContent', () => {
    let fixture;

    before(async () => {
      fixture = await createTestFixture({
        'text.txt': 'Hello World',
        'multiline.txt': 'Line 1\nLine 2\nLine 3',
      });
    });

    after(async () => {
      await fixture.cleanup();
    });

    test('reads text file content', async () => {
      await withCwd(fixture.dir, async () => {
        const content = await readFileContent('text.txt');
        assert.strictEqual(content, 'Hello World');
      });
    });

    test('reads multiline file content', async () => {
      await withCwd(fixture.dir, async () => {
        const content = await readFileContent('multiline.txt');
        assert.strictEqual(content, 'Line 1\nLine 2\nLine 3');
      });
    });

    test('returns null for non-existent file', async () => {
      await withCwd(fixture.dir, async () => {
        const content = await readFileContent('nonexistent.txt');
        assert.strictEqual(content, null);
      });
    });
  });
});
