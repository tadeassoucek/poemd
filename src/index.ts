import poemd = require("./main");
import { printColored } from "./utils";

// enable logging
poemd.log.write = poemd.log.example.CLIWriteFunc;

const parser = new poemd.Parser([], ["*", "**"]);
console.log(parser.initialNormalState.toString());
const tokens = parser.parse(`*hello*\nhey\r\naaa`);
console.log(tokens);
printColored(tokens);
