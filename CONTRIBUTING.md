# Contributing

Contributions are welcome, from typo corrections through bug fixes to feature additions!

I have but one request to you: **test your code before pushing!** This is something I'm pretty bad at, so do better than
me! The `scripts/` folder contains a couple of scripts to simplify this: just run `chmod +x scripts/*` after cloning the
repo.

If you want to make a commit, run the `scripts/commit` script (also executable with `npm run commit`). This script:

1. recompiles the TypeScript code from scratch (this helps prevent missing module errors);
2. formats your code using [Prettier](https://prettier.io/);
3. runs unit tests with `npm test`; and finally
4. commits the changes.

If you don't like these scripts or can't run them, that's fine! Just make sure to run those steps yourself.
