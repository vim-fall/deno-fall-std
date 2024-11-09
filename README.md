# 🍂 fall-std

[![JSR](https://jsr.io/badges/@vim-fall/std)](https://jsr.io/@vim-fall/std)
[![Test](https://github.com/vim-fall/fall-std/actions/workflows/test.yml/badge.svg)](https://github.com/vim-fall/fall-std/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/vim-fall/fall-std/graph/badge.svg?token=FWTFEJT1X1)](https://codecov.io/gh/vim-fall/fall-std)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Standard library for using [Fall](https://github.com/vim-fall/fall), a
Vim/Neovim Fuzzy Finder plugin powered by
[Denops](https://github.com/vim-denops/denops.vim).

It is also used to develop extensions of Fall.

## Usage

```ts
// Import Fall standard library functions and built-in utilities
import {
  composeRenderers,
  type Entrypoint,
  pipeProjectors,
} from "jsr:@vim-fall/std@^0.1.0"; // Fall standard library
import * as builtin from "jsr:@vim-fall/std@^0.1.0/builtin"; // Built-in Fall utilities

// Define custom actions for file handling, quickfix, and other operations
const myPathActions = {
  ...builtin.action.defaultOpenActions,
  ...builtin.action.defaultSystemopenActions,
  ...builtin.action.defaultCdActions,
};

const myQuickfixActions = {
  ...builtin.action.defaultQuickfixActions,
  "quickfix:qfreplace": builtin.action.quickfix({
    after: "Qfreplace", // Using the "Qfreplace" plugin for replacing text in quickfix
  }),
};

const myMiscActions = {
  ...builtin.action.defaultEchoActions,
  ...builtin.action.defaultYankActions,
  ...builtin.action.defaultSubmatchActions,
};

// Main entry point function for configuring the Fall interface
export const main: Entrypoint = (
  {
    defineItemPickerFromSource, // Define item pickers from source data
    defineItemPickerFromCurator, // Define item pickers from curators (e.g., Git grep)
    refineGlobalConfig, // Refine global settings (e.g., theme and layout)
  },
) => {
  // Set up global configuration (layout and theme)
  refineGlobalConfig({
    coordinator: builtin.coordinator.separate, // Use the "separate" layout style
    theme: builtin.theme.ASCII_THEME, // Apply ASCII-themed UI
  });

  // Configure item pickers for "git-grep", "rg", and "file" sources
  defineItemPickerFromCurator(
    "git-grep", // Picker for `git grep` results
    pipeProjectors(
      builtin.curator.gitGrep, // Uses Git to search
      builtin.modifier.relativePath, // Show relative paths
    ),
    {
      previewers: [builtin.previewer.file], // Preview file contents
      actions: {
        ...myPathActions,
        ...myQuickfixActions,
        ...myMiscActions,
      },
      defaultAction: "open", // Default action to open the file
    },
  );

  defineItemPickerFromCurator(
    "rg", // Picker for `rg` (ripgrep) results
    pipeProjectors(
      builtin.curator.rg, // Uses `rg` for searching
      builtin.modifier.relativePath, // Modify results to show relative paths
    ),
    {
      previewers: [builtin.previewer.file], // Preview file contents
      actions: {
        ...myPathActions,
        ...myQuickfixActions,
        ...myMiscActions,
      },
      defaultAction: "open", // Default action to open the file
    },
  );

  // File picker configuration with exclusion filters for unwanted directories
  defineItemPickerFromSource(
    "file", // Picker for files with exclusions
    pipeProjectors(
      builtin.source.file({
        excludes: [
          /.*\/node_modules\/.*/, // Exclude node_modules
          /.*\/.git\/.*/, // Exclude Git directories
          /.*\/.svn\/.*/, // Exclude SVN directories
          /.*\/.hg\/.*/, // Exclude Mercurial directories
          /.*\/.DS_Store$/, // Exclude macOS .DS_Store files
        ],
      }),
      builtin.modifier.relativePath, // Show relative paths
    ),
    {
      matchers: [builtin.matcher.fzf], // Use fuzzy search matcher
      renderers: [composeRenderers(
        builtin.renderer.smartPath, // Render smart paths
        builtin.renderer.nerdfont, // Render with NerdFont (requires NerdFont in terminal)
      )],
      previewers: [builtin.previewer.file], // Preview file contents
      actions: {
        ...myPathActions,
        ...myQuickfixActions,
        ...myMiscActions,
      },
      defaultAction: "open", // Default action to open the file
    },
  );

  // Configure "line" picker for selecting lines in a file
  defineItemPickerFromSource("line", builtin.source.line, {
    matchers: [builtin.matcher.fzf], // Use fuzzy search matcher
    previewers: [builtin.previewer.buffer], // Preview the buffer content
    actions: {
      ...myQuickfixActions,
      ...myMiscActions,
      ...builtin.action.defaultOpenActions,
      ...builtin.action.defaultBufferActions,
    },
    defaultAction: "open", // Default action to open the line
  });

  // Configure "buffer" picker for loaded buffers
  defineItemPickerFromSource(
    "buffer",
    builtin.source.buffer({ filter: "bufloaded" }), // Show only loaded buffers
    {
      matchers: [builtin.matcher.fzf], // Use fuzzy search matcher
      previewers: [builtin.previewer.buffer], // Preview the buffer content
      actions: {
        ...myQuickfixActions,
        ...myMiscActions,
        ...builtin.action.defaultOpenActions,
        ...builtin.action.defaultBufferActions,
      },
      defaultAction: "open", // Default action to open the buffer
    },
  );

  // Configure "help" picker for help tags
  defineItemPickerFromSource("help", builtin.source.helptag, {
    matchers: [builtin.matcher.fzf], // Use fuzzy search matcher
    previewers: [builtin.previewer.helptag], // Preview help tag content
    actions: {
      ...myMiscActions,
      ...builtin.action.defaultHelpActions, // Help actions
    },
    defaultAction: "help", // Default action is to show help
  });
};
```

## License

The code in this repository follows the MIT license, as detailed in
[LICENSE](./LICENSE). Contributors must agree that any modifications submitted
to this repository also adhere to the license.
