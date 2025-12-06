import { Service } from '@/services/service-registry';

import SketchKV from './milka-kv/sketch-kv.ts';

class MilkaKV extends Service {
  private conn?: Deno.Kv;
  private _sketches?: SketchKV;

  constructor() {
    super();

    this.initConnection();
  }

  close(): Promise<void> {
    return new Promise(() => this.conn?.close());
  }

  async initConnection() {
    this.conn = await Deno.openKv();

    this._sketches = new SketchKV(this.conn);
  }

  get sketches() {
    if (!this._sketches) {
      throw new Error('MilkaKV not initialized yet…');
    }

    return this._sketches!;
  }
}

export default MilkaKV;
