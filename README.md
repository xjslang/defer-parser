# @xjslang/defer-parser

A JavaScript parser that adds `defer` statements to the language, inspired by Go and V programming languages.

## Overview

This library extends JavaScript with `defer` functionality by transforming source code using AST manipulation. The `defer` statement allows you to specify code that should run when a function exits, regardless of how it exits (normal return, exception, etc.).

```javascript
function example() {
  defer console.log("This runs when function exits");

  if (someCondition) {
    return "early return"; // defer still executes
  }

  return "normal return"; // defer executes here too
}
```

## How it works

The parser uses a two-pass approach with industry-standard tools:

```
[Source Code] → acorn → [ESTree AST] → recast → [Final AST]
```

1. **First pass (acorn)**: Parses JavaScript source code into an ESTree-compatible AST, recognizing the new `defer` syntax
2. **Second pass (recast)**: Transforms the AST by analyzing function bodies and inserting the necessary control structures to implement defer behavior

### Why two passes?

The two-pass approach is necessary because we need to:

- Detect all `defer` statements in a function before generating the final code
- Determine the appropriate cleanup and exception handling structures
- Maintain compatibility with existing JavaScript semantics

## Installation

```bash
npm install @xjslang/defer-parser
```

### Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install acorn recast
```

## Usage

```javascript
import * as recast from 'recast'
import { parse as parseDefer } from './src/index.js'

const sourceCode = `
function connectToDB() {
  const conn = createDBConn();
  defer conn.close();

  const file = openFile("/path/to/file");
  defer { // you can use blocks
    file.close();
    // ... etc ...
  }

  // ... etc ...

  return "done!";
}
`

// generates the AST and prints it
const transformedCode = parseDefer(sourceCode)
const result = recast.print(transformedCode)
console.log(result.code)
```

## API

### `parse(code, options?)`

Transforms JavaScript code containing `defer` statements.

**Parameters:**

- `code` (string): Source JavaScript code with defer statements
- `options` (object, optional): Parser options

**Returns:** Transformed JavaScript code as a string

## Development

### Prerequisites

- Node.js >= 20.17 || >= 22
- npm

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

This project uses ESLint and Prettier for code formatting. Run `npm run lint:fix` and `npm run format` before submitting PRs.

## Architecture

### Core Dependencies

- **[acorn](https://github.com/acornjs/acorn)**: Fast JavaScript parser that generates ESTree-compatible AST
- **[recast](https://github.com/benjamn/recast)**: JavaScript syntax tree transformer that preserves original formatting

### Project Structure

```
src/
├── index.js          # Main entry point
├── parser.js         # Core parsing logic
├── builders.js       # AST node builders
└── libs/
    └── utils.js      # Utility functions
```

## Related

- [Go defer statement](https://golang.org/ref/spec#Defer_statements)
- [V defer statement](https://github.com/vlang/v/blob/master/doc/docs.md#defer)
- [ESTree specification](https://github.com/estree/estree)
