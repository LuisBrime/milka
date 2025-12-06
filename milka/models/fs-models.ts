export type SketchFileType = 'config' | 'dir' | 'file' | 'lib' | 'sketch';

export type SketchInfo = {
  children?: string[];
  fsPath: string;
  name: string;
  parent?: string;
  requestPath: string;
  type: SketchFileType;
};

export class SketchFileNode {
  public readonly children?: string[];
  public readonly fsPath: string;
  public readonly name: string;
  public readonly parent?: string;
  public readonly requestPath: string;
  public readonly type: SketchFileType;

  constructor(
    { children, fsPath, name, parent, requestPath, type }: SketchInfo,
  ) {
    this.children = children;
    this.fsPath = fsPath;
    this.name = name;
    this.parent = parent;
    this.requestPath = requestPath;
    this.type = type;
  }

  get cleanName() {
    const dotIndex = this.name.lastIndexOf('.');
    return dotIndex > 0 ? this.name.substring(0, dotIndex) : this.name;
  }

  toJSON(): SketchInfo {
    return {
      children: this.children,
      fsPath: this.fsPath,
      name: this.name,
      parent: this.parent,
      requestPath: this.requestPath,
      type: this.type,
    };
  }
}
