import poemd = require("./main");

poemd.log.write = poemd.log.exampleCLIWriteFunction;

const parser = new poemd.Parser([], ["*", "**"]);
console.log(parser.initialNormalState.toString());
console.log(parser.parse(`*hello*`));
