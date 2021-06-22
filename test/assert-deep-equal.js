const { AssertionError } = require("assert");

/**
 * A replacement for `assert.deepStrictEqual`, because it for some reason throws an error even if the two objects had
 * the same structure, saying "Objects have the same structure, but are not reference equal."
 */
module.exports = function assertDeepEqual(actual, expected, visited) {
  visited ||= [];

  function err() {
    throw new AssertionError({
      message: "These two values are not deeply equal.",
      actual: actual,
      expected: expected
    });
  }

  let t;
  if ((t = typeof actual) === typeof expected) {
    if (t == "object") {
      if (!visited.includes(expected)) {
        visited.push(expected);
        for (const key in expected)
          if (key in actual) assertDeepEqual(actual[key], expected[key], visited);
          else err();
      }
    } else if (t !== "function" && actual !== expected) err();
  } else err();
};
