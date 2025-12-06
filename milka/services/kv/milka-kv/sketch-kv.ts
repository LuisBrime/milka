import { SketchFileNode, type SketchInfo } from '@/models/fs-models';

class SketchKV {
  static key = 'sketches';
  static parentKey = 'parents';

  private conn: Deno.Kv;

  constructor(conn: Deno.Kv) {
    this.conn = conn;
  }

  saveNode(node: SketchFileNode) {
    const data = node.toJSON();
    const txn = this.conn.atomic().set([SketchKV.key, node.fsPath], data);

    if (node.children?.length) {
      for (const child of node.children) {
        txn.set([SketchKV.key, SketchKV.parentKey, child], node.fsPath);
      }
    }

    if (node.parent) {
      txn.set([SketchKV.key, SketchKV.parentKey, node.fsPath], node.parent);
    }

    return txn.commit();
  }

  async getNode(fsPath: string) {
    const record = await this.conn.get<SketchInfo>([SketchKV.key, fsPath]);

    if (!record.value) {
      return null;
    }

    return new SketchFileNode(record.value);
  }

  async getParent(childFsPath: string) {
    const parentRecord = await this.conn.get<string>([
      SketchKV.key,
      SketchKV.parentKey,
      childFsPath,
    ]);
    const parentFsPath = parentRecord.value;

    if (!parentFsPath) {
      return null;
    }

    const parentInfoRecord = await this.conn.get<SketchInfo>([
      SketchKV.key,
      parentFsPath,
    ]);

    if (!parentInfoRecord.value) {
      return null;
    }

    return new SketchFileNode(parentInfoRecord.value);
  }
}

export default SketchKV;
