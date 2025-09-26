# Defer Parser Plugin for XJS

This plugin adds support for `defer` statements in the [**XJS**](https://github.com/xjslang/xjs) language.

## Usage

```go
package main

import (
  "fmt"

  "github.com/xjslang/xjs/lexer"
  "github.com/xjslang/xjs/parser"
  deferparser "path/to/defer-parser"
)

func main() {
  input := `
  function processFile(filename) {
    let file = openFile(filename)
    defer {
      file.close()
      console.log("File closed")
    }
    
    let data = file.read()
    processData(data)
  }`
  
  lb := lexer.NewBuilder()
  parser := parser.NewBuilder(lb).Install(deferparser.Plugin).Build(input)
  program, err := parser.ParseProgram()
  if err != nil {
    panic(fmt.Sprintf("ParseProgram() error: %q", err))
  }
  fmt.Println(program)
}
```

## Syntax

```javascript
function myFunction() {
  // defer blocks execute when the function exits
  defer {
    cleanup()
    console.log("Function finished")
  }
  
  // main function logic
  doWork()
}
```

**Note**: `defer` can only be used inside functions. `defer` blocks are executed in LIFO order (last in, first out) when the function ends.
