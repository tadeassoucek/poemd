const poemd = require("../lib/main");
const assertDeepEqual = require("./assert-deep-equal");

describe("Parser", () => {
  const parser = new poemd.Parser(["--", "---"], ["*", "**", "~~~"]);

  it("should build a correct DFA from given marks and sequences", () => {
    poemd.Parser.State.resetID();
    const initial = new poemd.Parser.State();

    const dash1 = new poemd.Parser.State();
    new poemd.Parser.StateConnection("-", initial, dash1);
    const dash2 = new poemd.Parser.State(new poemd.poem.Token(poemd.poem.Token.Type.Sequence, "--"));
    new poemd.Parser.StateConnection("-", dash1, dash2);
    const dash3 = new poemd.Parser.State(new poemd.poem.Token(poemd.poem.Token.Type.Sequence, "---"));
    new poemd.Parser.StateConnection("-", dash2, dash3);

    const ast1 = new poemd.Parser.State(new poemd.poem.Token(poemd.poem.Token.Type.PendingMark, "*"));
    new poemd.Parser.StateConnection("*", initial, ast1);
    const ast2 = new poemd.Parser.State(new poemd.poem.Token(poemd.poem.Token.Type.PendingMark, "**"));
    new poemd.Parser.StateConnection("*", ast1, ast2);

    let last = initial,
      curr;
    for (let i = 0; i < 3; i++) {
      curr = new poemd.Parser.State();
      new poemd.Parser.StateConnection("~", last, curr);
      last = curr;
    }
    curr.payload = new poemd.poem.Token(poemd.poem.Token.Type.PendingMark, "~~~");

    assertDeepEqual(parser.initialNormalState, initial);
  });

  it("should correctly parse a couple of simple sequences", () => {
    assertDeepEqual(
      parser.parse("a-b ~~~boh~~axfor ***hey*** *hello*"),
      [
        ["text", "a-b "],
        ["pending_mark", "~~~"],
        "boh~~axfor ",
        ["pending_mark", "**"],
        ["pending_mark", "*"],
        "hey",
        ["pending_mark", "**"],
        ["pending_mark", "*"],
        " ",
        ["pending_mark", "*"],
        "hello",
        ["pending_mark", "*"]
      ].map((e) => new poemd.poem.Token(typeof e === "string" ? "text" : e[0], typeof e === "string" ? e : e[1]))
    );
  });
});
