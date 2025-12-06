import { assertEquals, assertObjectMatch } from '@std/assert';
import { describe, it } from '@std/testing/bdd';

import { SketchFileNode } from '@/models/fs-models';

const mockBasePath = '/path';

describe('SketchFileNode', () => {
  it('creates a model with all the properties', () => {
    const fileNode = new SketchFileNode({
      fsPath: mockBasePath,
      name: 'fileNode.ts',
      requestPath: mockBasePath,
      type: 'file',
    });

    assertEquals(fileNode.cleanName, 'fileNode');
    assertEquals(fileNode.fsPath, mockBasePath);
    assertEquals(fileNode.name, 'fileNode.ts');
    assertEquals(fileNode.requestPath, mockBasePath);
  });

  it('toJSON() returns the proper object', () => {
    const fileNode = new SketchFileNode({
      fsPath: mockBasePath,
      name: 'fileNode.ts',
      requestPath: mockBasePath,
      type: 'file',
    });

    const data = fileNode.toJSON();
    assertObjectMatch(
      data,
      {
        fsPath: mockBasePath,
        name: 'fileNode.ts',
        requestPath: mockBasePath,
        type: 'file',
      },
    );
  });
});
