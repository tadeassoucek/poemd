import { OneOrMany, setDefaults } from "./utils";
import { Renderer } from "./renderers/renderer";
import { inspect } from "./utils";
import { Token } from "./poem";
import { debug } from "./log";

type MatchBounds = "none" | "stanza" | "line";
type OnNewTaskWhenBusy = "accept" | "reject" | "error";

export type ParsingOptions = {
  markdownMatchBounds?: MatchBounds;
  quoteMatchBounds?: MatchBounds;
  onNewTaskWhenBusy?: OnNewTaskWhenBusy;
};

const defaultParsingOptions: Required<ParsingOptions> = {
  markdownMatchBounds: "stanza",
  quoteMatchBounds: "none",
  onNewTaskWhenBusy: "error"
};

export class Parser {
  readonly sequences: string[];
  readonly marks: string[];

  initialNormalState: Parser.State;

  private currentState: Parser.State;
  private sequenceBuffer: string;

  private charBuffer: string;

  private options: ParsingOptions;

  private tokens: Token[];

  constructor(renderer?: Renderer, options?: ParsingOptions);
  constructor(renderers?: Renderer[], options?: ParsingOptions);
  constructor(sequences?: string[], marks?: string[], options?: ParsingOptions);
  constructor(
    rendererRenderersOrSequences: string[] | OneOrMany<Renderer>,
    marksOrOptions?: string[] | ParsingOptions,
    definitelyOptions?: ParsingOptions
  ) {
    this.sequences = [];
    this.marks = [];

    if (rendererRenderersOrSequences instanceof Renderer) {
      this.sequences = rendererRenderersOrSequences.collectSequences();
      this.marks = rendererRenderersOrSequences.collectMarks();
    } else if (rendererRenderersOrSequences instanceof Array) {
      rendererRenderersOrSequences.forEach((rs: string | Renderer) => {
        if (rs instanceof Renderer) {
          this.sequences.push(...rs.collectSequences());
          this.marks.push(...rs.collectMarks());
        } else if (typeof rs === "string") this.sequences.push(rs);
        else throw new Error("unexpected type in first argument: " + typeof rs);
      });
    } else if (rendererRenderersOrSequences)
      throw new Error(
        "first argument has to be an array of strings, a Renderer object or an array of Renderer objects"
      );

    if (marksOrOptions instanceof Array)
      marksOrOptions.forEach((m) => {
        if (typeof m === "string") this.marks.push(m);
        else throw new Error("unexpected type in second argument: " + typeof m);
      });
    else if (marksOrOptions instanceof Object) this.options = setDefaults(marksOrOptions, defaultParsingOptions);
    else if (marksOrOptions) throw new Error("second argument has to be an array of strings or an object");

    if (definitelyOptions) {
      if (definitelyOptions instanceof Object) this.options = setDefaults(definitelyOptions, defaultParsingOptions);
      else throw new Error("third argument has to be an object");
    }

    this.createStates();
    this.tokens = [];
    this.charBuffer = "";
  }

  createStates() {
    this.initialNormalState = new Parser.State();

    const allSequences = [...this.sequences, ...this.marks];
    const groupSequencesByCharOnIndex = (sequences: string[], index: number) => {
      const storage: Record<string, string[]> = {};
      sequences.forEach((item) => {
        const group = item[index];
        if (!group) return;
        storage[group] ||= [];
        storage[group].push(item);
      });
      return storage;
    };

    const maxLength = Math.max(...allSequences.map((seq) => seq.length));

    const whatIs = (s: string) =>
      this.marks.includes(s) ? "mark" : this.sequences.includes(s) ? "sequence" : "nothing";

    (function createLayer(srcState: Parser.State, sequences: string[], accumulator: string, index: number) {
      if (index >= maxLength) return;
      const grouped = groupSequencesByCharOnIndex(sequences, index);
      for (const group in grouped)
        if (group) {
          const seq = accumulator + group;
          const type = whatIs(seq);
          const state = new Parser.State(
            type != "nothing" ? new Token(type == "mark" ? Token.Type.PendingMark : Token.Type.Sequence, seq) : void 0
          );
          new Parser.StateConnection(group, srcState, state);
          createLayer(state, grouped[group], seq, index + 1);
        }
    })(this.initialNormalState, allSequences, "", 0);

    this.resetState();
  }

  reset() {
    this.currentState = this.initialNormalState;
    this.charBuffer = this.sequenceBuffer = "";
    this.tokens = [];
  }

  private addChar(c: string) {
    if (c != "\0") this.charBuffer += c;
  }

  private flush() {
    if (this.charBuffer) this.tokens.push(new Token(Token.Type.Text, this.charBuffer));
    this.charBuffer = "";
    this.sequenceBuffer = "";
  }

  private handleChar(c: string) {
    // if we can continue to another state
    for (const conn of this.currentState.outConnections)
      if (c === conn.char) {
        // move to the new state
        this.currentState = conn.out;

        // if the new state has a payload and no outgoing connections
        if (!this.currentState.outConnections.length) {
          if (!this.currentState.payload)
            throw new Parser.InternalError(
              "Leaf state with no payload.",
              "Any parser state can either lead to a different state, hold a payload, or lead to a different state " +
                "and hold a payload. Since a leaf parser state leads to no other state by definition, it must have " +
                "a payload.",
              this.currentState
            );

          this.flush();
          // push payload as token
          this.tokens.push(this.currentState.payload.clone());
          // return to the initial state. we don't care about the seqbuf
          this.resetState();
        } else this.sequenceBuffer += c;

        return;
      }

    // no state to continue to

    let state = this.currentState;

    // return until you hit the initial state or a state with a payload
    while (state != this.initialNormalState && !state.payload) state = state.inConnection.in;

    // the state we ended on has a payload
    if (state.payload) {
      let awaitingHandle: string;
      // handle any extra characters in the seqbuf, e.g. if the sequences are ['-', '---'] and we have a '--' at the
      // input, we need to do a little bit of recursion to handle it as what it's supposed to be (two '-' sequences,
      // in this case)
      if (this.sequenceBuffer.length !== state.payload.value.length) {
        this.sequenceBuffer = this.sequenceBuffer.substring(state.payload.value.length);
        awaitingHandle = this.sequenceBuffer;
      }

      this.flush();
      this.tokens.push(state.payload.clone());
      this.resetState();
      this.addChar(c);

      if (awaitingHandle) awaitingHandle.split("").forEach((c) => this.handleChar(c));
    }
    // we ended on the initial state
    else {
      this.charBuffer += this.resetState();
      this.addChar(c);
    }

    // end of the string, reset and flush
    if (c === "\0") {
      this.resetState(true);
      this.flush();
    }
  }

  /**
   * Resets the state and the sequence buffer.
   * @param addToCharbuf If `true`, the sequence buffer is added to the char buffer before being overwritten.
   * @returns the value of the sequence buffer (before it was overwritten).
   */
  private resetState(addToCharbuf = false): string {
    this.currentState = this.initialNormalState;
    const val = this.sequenceBuffer;
    this.sequenceBuffer = "";
    if (addToCharbuf) this.charBuffer += this.sequenceBuffer;
    return val;
  }

  parse(s: string): Token[] {
    (s + "\0").split("").forEach((c) => this.handleChar(c));
    return this.tokens;
  }
}

export namespace Parser {
  /** Represents a state the parser can be in. */
  export class State {
    private static ID = 0;

    static resetID() {
      State.ID = 0;
    }

    /** Allows simple identification of the state. */
    id: number;

    /** The incoming connection. If `undefined`, this is the initial state. */
    inConnection?: StateConnection;
    /**
     * Outgoing connections. If empty, this is a leaf state, meaning it the parser has nowhere to continue and must accept
     * its payload ({@see this.payload}).
     */
    outConnections: StateConnection[];

    /** The token to be inserted when this state is reached and there is nowhere else to move to. */
    payload?: Token;

    constructor(payload?: Token) {
      this.id = State.ID++;
      this.payload = payload;
      this.outConnections = [];
    }

    toString(depth = 0): string {
      let s = "(#" + this.id;
      if (this.payload) s += ` ${inspect(this.payload.type)}:${inspect(this.payload.value)}`;
      s += ")\n";
      const indent = "  ".repeat(depth + 1);
      for (const con of this.outConnections) s += indent + con.toString(depth + 1);
      return s;
    }
  }

  /** Represents a connection between parser states. */
  export class StateConnection {
    char: string;
    in: Parser.State;
    out: Parser.State;

    constructor(char: string, in_: Parser.State, out: Parser.State) {
      this.char = char;
      this.in = in_;
      this.in.outConnections.push(this);
      this.out = out;
      this.out.inConnection = this;
    }

    toString(depth = 0): string {
      return inspect(this.char) + " -> " + this.out.toString(depth);
    }
  }

  export class InternalError extends Error {
    readonly title: string;
    readonly desc: string;
    readonly state: Parser.State;

    constructor(title: string, desc: string, state: Parser.State) {
      super(`${title} (${desc})`);
      this.name = "Internal Parser Error";
      this.title = title;
      this.desc = desc;
      this.state = state;
    }
  }
}
