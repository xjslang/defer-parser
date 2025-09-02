package deferparser

import (
	"strings"

	tryparser "github.com/xjslang/try-parser"

	"github.com/xjslang/xjs/ast"
	"github.com/xjslang/xjs/parser"
	"github.com/xjslang/xjs/token"
)

type DeferStatement struct {
	Body *ast.BlockStatement
}

// `defer` statement doesn't have a JS translation
func (ds *DeferStatement) WriteTo(b *strings.Builder) {}

func ParseDeferStatement(p *parser.Parser, next func() ast.Statement) ast.Statement {
	if p.CurrentToken.Type != token.IDENT || p.CurrentToken.Literal != "defer" {
		return next()
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
						TryBlock: fd.Body,
						FinallyBlock: &ast.BlockStatement{
							Statements: []ast.Statement{
								// for (let i = defers.length - 1; i >= 0; i--)
								&ast.ForStatement{
									// let i = defers.length - 1
									Init: &ast.LetStatement{
										Name: &ast.Identifier{Value: "i"},
										Value: &ast.BinaryExpression{
											Left: &ast.MemberExpression{
												Object:   &ast.Identifier{Value: "defers"},
												Property: &ast.Identifier{Value: "length"},
											},
											Operator: "-",
											Right:    &ast.IntegerLiteral{Token: token.Token{Literal: "1"}},
										},
									},
									// i >= 0
									Condition: &ast.BinaryExpression{
										Left:     &ast.Identifier{Value: "i"},
										Operator: ">=",
										Right:    &ast.IntegerLiteral{Token: token.Token{Literal: "0"}},
									},
									// i --
									Update: &ast.AssignmentExpression{
										Left: &ast.Identifier{Value: "i"},
										Value: &ast.BinaryExpression{
											Left:     &ast.Identifier{Value: "i"},
											Operator: "-",
											Right:    &ast.IntegerLiteral{Token: token.Token{Literal: "1"}},
										},
									},
									// try { defers[i]() } catch { console.log(e) }
									Body: &ast.BlockStatement{
										Statements: []ast.Statement{
											&tryparser.TryStatement{
												TryBlock: &ast.BlockStatement{
													Statements: []ast.Statement{
														// defers[i]()
														&ast.CallExpression{
															Function: &ast.MemberExpression{
																Object:   &ast.Identifier{Value: "defers"},
																Property: &ast.Identifier{Value: "i"},
																Computed: true,
															},
														},
													},
												},
												CatchParameter: &ast.Identifier{Value: "e"},
												CatchBlock: &ast.BlockStatement{
													Statements: []ast.Statement{
														// console.log(e)
														&ast.CallExpression{
															Function: &ast.MemberExpression{
																Object:   &ast.Identifier{Value: "console"},
																Property: &ast.Identifier{Value: "log"},
															},
															Arguments: []ast.Expression{
																&ast.Identifier{Value: "e"},
															},
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
				},
			}
		}
	}
	return program
}
