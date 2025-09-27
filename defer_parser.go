package deferparser

import (
	"strings"

	"github.com/rs/xid"
	"github.com/xjslang/xjs/ast"
	"github.com/xjslang/xjs/lexer"
	"github.com/xjslang/xjs/parser"
	"github.com/xjslang/xjs/token"
)

type DeferFunctionDeclaration struct {
	ast.FunctionDeclaration
	prefix string
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

	hasDefers := false
	for _, stmt := range fd.Body.Statements {
		if _, ok := stmt.(*DeferStatement); ok {
			hasDefers = true
			break
		}
	}

	if hasDefers {
		deferName := "defers_" + fd.prefix
		indexName := "i_" + fd.prefix
		errorName := "e_" + fd.prefix
		b.WriteString(") {let " + deferName + "=[];try")
		fd.Body.WriteTo(b)
		b.WriteString(
			"finally{" +
				"for(let " + indexName + "=" + deferName + ".length;" + indexName + ">0;" + indexName + "--){" +
				"try{" + deferName + "[" + indexName + "-1]()}catch(" + errorName + "){console.log(" + errorName + ")}}}}",
		)
	} else {
		b.WriteRune(')')
		fd.Body.WriteTo(b)
	}
}

type DeferStatement struct {
	Body   *ast.BlockStatement
	prefix string
}

// `defer` statement doesn't have a JS translation
func (ds *DeferStatement) WriteTo(b *strings.Builder) {
	deferName := "defers_" + ds.prefix
	b.WriteString(deferName + ".push(() =>")
	ds.Body.WriteTo(b)
	b.WriteRune(')')
}

func Plugin(pb *parser.Builder) {
	id := xid.New()
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

		stmt := &DeferFunctionDeclaration{prefix: id.String()}
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
		stmt := &DeferStatement{prefix: id.String()}
		stmt.Body = p.ParseBlockStatement()
		return stmt
	})
}
