import poemd = require("./main");

const parser = new poemd.Parser(["--", "---"]);
console.log(parser.parse(`---`));
