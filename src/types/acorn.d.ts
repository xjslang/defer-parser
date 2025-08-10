/**
 * Type definitions extending the Acorn Parser interface
 * for a better development experience (DX).
 *
 * These definitions enable better TypeScript support when working with Acorn's
 * internal parser methods, which are not exposed in the main type definitions.
 */
import * as acorn from 'acorn'

declare module 'acorn' {
  interface Parser {
    // ===== STATE PROPERTIES =====
    input: string
    options: acorn.Options

    // Current token state
    type: acorn.TokenType
    value: string | number | RegExp | bigint | null
    start: number
    end: number
    startLoc: acorn.Position | null
    endLoc: acorn.Position | null

    // Previous token state
    lastTokEnd: number
    lastTokStart: number
    lastTokEndLoc: acorn.Position | null
    lastTokStartLoc: acorn.Position | null

    // ===== TOKENIZATION METHODS =====

    // Advance to the next token
    next(): void

    // Consume a specific token if it matches
    eat(type: acorn.TokenType): boolean

    // Check if the current token is a specific contextual keyword
    isContextual(name: string): boolean

    // Consume a specific contextual keyword
    eatContextual(name: string): boolean

    // Expect a specific contextual keyword (throws if not matched)
    expectContextual(name: string): void

    // Check if a semicolon can be automatically inserted
    canInsertSemicolon(): boolean

    // Insert a semicolon automatically if possible
    insertSemicolon(): boolean

    // Parse or insert a semicolon
    semicolon(): void

    // Expect a specific token (throws if not matched)
    expect(type: acorn.TokenType): void

    // Throw unexpected token error
    unexpected(pos?: number): never

    // ===== AST CONSTRUCTION =====

    // Create a new AST node at the current position
    startNode(): acorn.Node

    // Create a new AST node at a specific position
    startNodeAt(pos: number, loc?: acorn.Position): acorn.Node

    // Finish an AST node with a specific type
    finishNode<T extends acorn.Node>(node: T, type: string): T

    // Finish an AST node at a specific position
    finishNodeAt<T extends acorn.Node>(
      node: T,
      type: string,
      pos: number,
      loc?: acorn.Position
    ): T

    // ===== STATEMENT PARSING =====

    // Parse a statement
    parseStatement(
      context?: string,
      topLevel?: boolean,
      exports?: Record<string, boolean>
    ): acorn.Node

    // Parse a code block
    parseBlock(createNewLexicalScope?: boolean, node?: acorn.Node): acorn.Node

    // Parse variable declaration
    parseVar(node: acorn.Node, isFor?: boolean, kind?: string): acorn.Node

    // Parse variable statement (var/let/const)
    parseVarStatement(node: acorn.Node, kind: string): acorn.Node

    // Parse function declaration
    parseFunctionStatement(
      node: acorn.Node,
      isAsync?: boolean,
      declarationPosition?: boolean
    ): acorn.Node

    // Parse class declaration
    parseClass(node: acorn.Node, isStatement: boolean): acorn.Node

    // Parse for loop
    parseFor(node: acorn.Node, init: acorn.Node | null): acorn.Node

    // Parse for-in/for-of loop
    parseForIn(node: acorn.Node, init: acorn.Node): acorn.Node

    // ===== EXPRESSION PARSING =====

    // Parse an expression
    parseExpression(
      forInit?: boolean,
      refDestructuringErrors?: Record<string, unknown>
    ): acorn.Node

    // Parse assignment expression
    parseMaybeAssign(
      forInit?: boolean,
      refDestructuringErrors?: Record<string, unknown>,
      afterLeftParse?: (
        node: acorn.Node,
        startPos: number,
        startLoc: acorn.Position
      ) => acorn.Node
    ): acorn.Node

    // Parse conditional (ternary) expression
    parseMaybeConditional(
      forInit?: boolean,
      refDestructuringErrors?: Record<string, unknown>
    ): acorn.Node

    // Parse unary expression
    parseMaybeUnary(
      refDestructuringErrors?: Record<string, unknown>,
      sawUnary?: boolean
    ): acorn.Node

    // Parse atomic expression (literals, identifiers, etc.)
    parseExprAtom(refDestructuringErrors?: Record<string, unknown>): acorn.Node

    // ===== UTILITY METHODS =====

    // Throw a parsing error at a specific position
    raise(pos: number, message: string): never

    // Throw a recoverable error
    raiseRecoverable(pos: number, message: string): void

    // Get the current position in the code
    curPosition(): acorn.Position

    // Check if "let" is a keyword in the current context
    isLet(context?: string): boolean
  }
}
