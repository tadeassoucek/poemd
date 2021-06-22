# `poemd`

This is a Typescript implementation of PoeMD. For more information about the PoeMD language, see
[the PoeMD specification](https://github.com/tadeassoucek/poemd/wiki/PoeMD-v1.0).

For documentation about the implementation, see [the wiki](https://github.com/tadeassoucek/poemd/wiki).

## Basic information

PoeMD is a Markdown-based language for writing poems. Its goal is to create simple to write, easy to read source files
that use only ASCII characters and that can be turned into HTML or LaTeX code with little to no changes to the source
code.

Each file (saved with either the `.poe` or the `.poemd` extension) describes one poem — its title, subtitle, sections
and stanzas.

The source code of `poemd` is written in TypeScript and can be found inside the `src` folder. To compile it, run `tsc`
in the package folder and it will create a `lib` folder with the generated JavaScript code inside.

When working on the source code I would recommend running `tsc` with the `--watch` option (or `-w` for short) in the
background instead of compiling every time you want to run it. That's because incremental compilation is much quicker
than one that happens from ground up.

The [`src/index.ts`](https://github.com/tadeassoucek/poemd/blob/main/src/index.ts) file (and its generated equivalent,
`lib/index.js`) is invoked by the `npm start` command and usually just contains code that prints the result of a poem
render to the console. It's used simply for quick and dirty testing and is not published to the NPM registry.

Unit tests are written in JavaScript and can be found inside the `test` folder. [Mocha](https://mochajs.org/) is used to
run them via the `npm test` command.

The code and documentation is formatted with [Prettier](https://prettier.io/).

## Installation

```
npm install poemd
```

## Documentation

For any and all documentation, see [this project's wiki](https://github.com/tadeassoucek/poemd/wiki).
