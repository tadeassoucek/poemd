interface ICloneable<T> {
  clone(): T;
}

interface ISerializable<T> {
  serialize(): string;
  deserialize(json: string): T;
}

type TokenValue = string;

export class Token implements ICloneable<Token> {
  type: Token.Type;
  value: TokenValue;

  constructor(type: Token.Type, value?: TokenValue) {
    this.type = type;
    this.value = value;
  }

  /** Creates a new token with the same type and value. */
  clone() {
    return new Token(this.type, this.value);
  }
}

export namespace Token {
  export enum Type {
    Text = "text",
    Raw = "raw",
    PendingMark = "pending_mark",
    OpeningMark = "opening_mark",
    ClosingMark = "closing_mark",
    OpeningQuote = "opening_quote",
    ClosingQuote = "closing_quote",
    Sequence = "sequence"
  }
}

export class Poem {
  content: PoemContent[];

  constructor() {
    this.content = [];
  }
}

export abstract class PoemContent {}

export class Stanza extends PoemContent {}

export class ThematicBreak extends PoemContent {}

export class VerseLine {
  indentLevel: number;
  isContinuation: boolean;
  invisiblePrefix: Token[];
  tokens: Token[];

  constructor() {
    this.indentLevel = 0;
    this.isContinuation = false;
    this.tokens = [];
  }
}
