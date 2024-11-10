# 🍂 fall-std

[![JSR](https://jsr.io/badges/@vim-fall/std)](https://jsr.io/@vim-fall/std)
[![Deno](https://img.shields.io/badge/Deno%202.x-333?logo=deno&logoColor=fff)](#)
[![Test](https://github.com/vim-fall/fall-std/actions/workflows/test.yml/badge.svg)](https://github.com/vim-fall/fall-std/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/vim-fall/fall-std/graph/badge.svg?token=FWTFEJT1X1)](https://codecov.io/gh/vim-fall/fall-std)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

A standard library for using [Fall](https://github.com/vim-fall/fall), a
Vim/Neovim Fuzzy Finder plugin powered by
[Denops](https://github.com/vim-denops/denops.vim). Users should import this
library in Fall's configuration file (`fall/config.ts`) to use the built-in
extensions and utility functions.

## Usage

### Extensions

Extensions are available in the `builtin` directory. You can access them like
this:

```typescript
import * as builtin from "jsr:@vim-fall/std/builtin";

// Display all curators
console.log(builtin.curator);

// Display all sources
console.log(builtin.source);

// Display all actions
console.log(builtin.action);

// ...
```

### Utility Functions

Utility functions are defined in the root directory. You can access them like
this:

```typescript
import * as builtin from "jsr:@vim-fall/std/builtin";
import * as std from "jsr:@vim-fall/std";

// Refine a source with refiners
const refinedSource = std.refineSource(
  // File source
  builtin.source.file,
  // Refiner to filter files based on the current working directory
  builtin.refiner.cwd,
  // Refiner to modify item paths to be relative from the current working directory
  builtin.refiner.relativePath,
  // ...
);
```

### More Extensions

For more extensions (including integrations with other Vim plugins, non-standard
workflows, etc.), check out
[vim-fall/fall-extra](https://github.com/vim-fall/fall-extra)
([@vim-fall/extra](https://jsr.io/@vim-fall/extra)).

## License

The code in this repository follows the MIT license, as detailed in the LICENSE.
Contributors must agree that any modifications submitted to this repository also
adhere to the license.

This Markdown version will render properly when used in a Markdown environment.
Let me know if you'd like to adjust anything further!
