type RenderingOptions = {};

type Mark = {
  opening: string;
  closing: string;
  requirements?: string[];
};

export abstract class Renderer {
  langNames: string[];
  sequences: Record<string, string>;
  marks: Record<string, Mark>;
  renderingOptions: RenderingOptions;

  collectMarks(): string[] {
    const set = new Set<string>();
    Object.keys(this.marks).forEach((mark) => set.add(mark));
    // Object.values(this.modes).forEach((mode) => Object.keys(mode.marks).forEach((mark) => set.add(mark)));
    return [...set];
  }

  collectSequences(): string[] {
    const set = new Set<string>();
    Object.keys(this.sequences).forEach((s) => set.add(s));
    // Object.values(this.modes).forEach((m) => Object.keys(m.sequences).forEach((s) => set.add(s)));
    return [...set];
  }
}
