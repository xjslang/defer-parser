package deferparser

import (
	tryparser "github.com/xjslang/try-parser"

	"github.com/xjslang/xjs/ast"
	"github.com/xjslang/xjs/parser"
	"github.com/xjslang/xjs/token"
)

type DeferStatement struct {
	ast.Node
	Body *ast.BlockStatement
}

func (ds *DeferStatement) String() string {
	return ""
}

func ParseDeferStatement(p *parser.Parser, next func(p *parser.Parser) ast.Statement) ast.Statement {
	if p.CurrentToken.Type != token.IDENT || p.CurrentToken.Literal != "defer" {
		return next(p)
	}

	if !p.IsInFunction() {
		p.AddError("defer statement can only be used inside functions")
		return nil
	}

	if !p.ExpectToken(token.LBRACE) {
		return nil
	}
	stmt := &DeferStatement{}
	stmt.Body = p.ParseBlockStatement()
	return stmt
}

func Recast(program *ast.Program) *ast.Program {
	for _, stmt := range program.Statements {
		if fd, ok := stmt.(*ast.FunctionDeclaration); ok {
			// replaces each `defer { ... }` with `defers.push(function () { ... })`
			for i, bodyStmt := range fd.Body.Statements {
				if deferStmt, ok := bodyStmt.(*DeferStatement); ok {
					fd.Body.Statements[i] = &ast.ExpressionStatement{
						Expression: &ast.CallExpression{
							Function: &ast.MemberExpression{
								Object:   &ast.Identifier{Value: "defers"},
								Property: &ast.Identifier{Value: "push"},
							},
							Arguments: []ast.Expression{
								&ast.FunctionExpression{
									Body: deferStmt.Body,
								},
							},
						},
					}
				}
			}

			// wraps the function body around `try { ... } finally { ... }`
			fd.Body = &ast.BlockStatement{
				Statements: []ast.Statement{
					// let defers = []
					&ast.LetStatement{
						Name:  &ast.Identifier{Value: "defers"},
						Value: &ast.ArrayLiteral{},
					},
					// try { ... } finally { ... }
					&tryparser.TryStatement{
						TryBlock:     fd.Body,
						FinallyBlock: &ast.BlockStatement{},
					},
				},
			}
		}
	}
	return program
}
