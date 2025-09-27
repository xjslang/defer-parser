package deferparser

import (
	"strings"

	"github.com/xjslang/xjs/ast"
	"github.com/xjslang/xjs/lexer"
	"github.com/xjslang/xjs/parser"
	"github.com/xjslang/xjs/token"
)

type DeferFunctionDeclaration struct {
	ast.FunctionDeclaration
}

func (fd *DeferFunctionDeclaration) WriteTo(b *strings.Builder) {
	b.WriteString("function ")
	fd.Name.WriteTo(b)
	b.WriteRune('(')
	for i, param := range fd.Parameters {
		if i > 0 {
			b.WriteRune(',')
		}
		param.WriteTo(b)
	}
	b.WriteString(") {let defers=[];try")
	fd.Body.WriteTo(b)
	b.WriteString("finally{for(let i=defers.length;i>0;i--){defers[i-1]()}}}")
}

type DeferStatement struct {
	Body *ast.BlockStatement
}

// `defer` statement doesn't have a JS translation
func (ds *DeferStatement) WriteTo(b *strings.Builder) {
	b.WriteString("defers.push(() =>")
	ds.Body.WriteTo(b)
	b.WriteRune(')')
}

func Plugin(pb *parser.Builder) {
	lb := pb.LexerBuilder
	deferTokenType := lb.RegisterTokenType("DeferStatement")
	lb.UseTokenInterceptor(func(l *lexer.Lexer, next func() token.Token) token.Token {
		ret := next()
		if ret.Type == token.IDENT && ret.Literal == "defer" {
			ret.Type = deferTokenType
		}
		return ret
	})
	pb.UseStatementInterceptor(func(p *parser.Parser, next func() ast.Statement) ast.Statement {
		if p.CurrentToken.Type != token.FUNCTION {
			return next()
		}

		stmt := &DeferFunctionDeclaration{}
		stmt.Token = p.CurrentToken
		if !p.ExpectToken(token.IDENT) {
			return nil
		}
		stmt.Name = &ast.Identifier{Token: p.CurrentToken, Value: p.CurrentToken.Literal}
		if !p.ExpectToken(token.LPAREN) {
			return nil
		}
		stmt.Parameters = p.ParseFunctionParameters()
		if !p.ExpectToken(token.LBRACE) {
			return nil
		}
		p.PushContext(parser.FunctionContext)
		defer p.PopContext()
		stmt.Body = p.ParseBlockStatement()
		return stmt
	})
	pb.UseStatementInterceptor(func(p *parser.Parser, next func() ast.Statement) ast.Statement {
		if p.CurrentToken.Type != deferTokenType {
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
	})
}
