# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@vim-fall/std`, the standard library for Fall - a fuzzy finder plugin for Vim/Neovim powered by Denops. The project provides built-in extensions and utility functions for the Fall ecosystem, written in Deno/TypeScript.

## Key Commands

### Development

- **Type check**: `deno task check` - Run TypeScript type checking
- **Test**: `deno test -A --parallel --shuffle --doc` - Run all tests
- **Test single file**: `deno test -A path/to/file_test.ts` - Run specific test file
- **Test with coverage**: `deno task test:coverage` - Run tests with coverage collection
- **Lint**: `deno lint` - Run Deno linter
- **Format**: `deno fmt` - Auto-format code
- **Format check**: `deno fmt --check` - Check formatting without modifying

### Code Generation

- **Generate all**: `deno task gen` - Run all code generation tasks
- **Generate modules**: `deno task gen:mod` - Generate module files in each directory
- **Generate exports**: `deno task gen:exports` - Generate export declarations
- **Generate nerdfont**: `deno task gen:builtin-renderer-nerdfont` - Generate nerdfont icon mappings

### Dependencies

- **Update check**: `deno task update` - Check for dependency updates
- **Update write**: `deno task update:write` - Update dependencies in place
- **Update commit**: `deno task update:commit` - Update and commit dependency changes

### Publishing

- **Dry run**: `deno publish --dry-run` - Test JSR publishing without publishing

## Architecture

### Module Organization

The codebase follows a plugin-based architecture with these core concepts:

1. **Extension Types** (in `/builtin/`):

   - **Actions**: Operations performed on selected items (open, yank, cd)
   - **Coordinators**: UI layout managers (compact, modern, separate)
   - **Curators**: Search/filter tools wrapping external commands (grep, ripgrep, git-grep)
   - **Matchers**: Fuzzy matching algorithms (fzf, regexp, substring)
   - **Previewers**: Item preview handlers (file, buffer, helptag)
   - **Refiners**: Item transformation/filtering tools
   - **Renderers**: Display formatters (nerdfont icons, path formatting)
   - **Sorters**: Sorting algorithms (lexical, numerical)
   - **Sources**: Data providers (files, buffers, quickfix, history)
   - **Themes**: UI border styles (ascii, modern, single, double)

2. **Core APIs** (in root):

   - Each extension type has a corresponding definition file (e.g., `action.ts`, `source.ts`)
   - These files define the interface and helper functions for that extension type
   - The `mod.ts` file re-exports utility functions for composing extensions

3. **Denops Integration**:
   - All extensions receive a `Denops` instance for Vim/Neovim interaction
   - Uses `@denops/std` for Vim API access
   - Test files use `@denops/test` for testing with real Vim instances

### Key Patterns

1. **Extension Definition**: Use `define*` functions (e.g., `defineAction`, `defineSource`)
2. **Composition**: Use `compose*` functions to combine multiple extensions
3. **Type Safety**: Extensive use of TypeScript generics for item detail types
4. **Async/Streaming**: Sources use async generators for efficient data streaming
5. **Parameter Binding**: `ArgsBinder` pattern for flexible parameter handling

### Testing Approach

- Tests use Deno's built-in test runner with `Deno.test()`
- Integration tests use real Vim/Neovim instances via `@denops/test`
- Test files follow `*_test.ts` naming convention
- Use `@std/assert` for assertions

### Libraries

- Use `@core/unknownutil` for type-guarding unknown types
  - Note that if you use `@denops/std/function`, some functions already provides proper types so you may not need to use `@core/unknownutil`
  - You should try hard to avoid using `as any` or `as unkonwn as`. Proper type-guarding is preferred.
- Use `@denops/std` for Vim/Neovim API access.

