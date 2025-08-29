package deferparser

import (
	"fmt"
	"testing"

	"github.com/xjslang/xjs/lexer"
	"github.com/xjslang/xjs/parser"
)

func TestParser(t *testing.T) {
	input := `
	function foo() {
		let db = createDbConn()
		defer {
			db.close()
		}
	}`
	l := lexer.New(input)
	p := parser.New(l)
	p.UseStatementHandler(ParseDeferStatement)
	program := p.ParseProgram()
	program = Recast(program)
	// jsonBytes, _ := json.MarshalIndent(program, "", "  ")
	// fmt.Println(string(jsonBytes))
	fmt.Println(program.String())
}

func TestDeferOutsideFunction(t *testing.T) {
	input := `
	defer {
		console.log("This should cause an error")
	}`
	l := lexer.New(input)
	p := parser.New(l)
	p.UseStatementHandler(ParseDeferStatement)
	_ = p.ParseProgram() // Parse to trigger error checking

	errors := p.Errors()
	if len(errors) == 0 {
		t.Errorf("Expected error when defer is used outside function, but got none")
	}

	expectedError := "defer statement can only be used inside functions"
	found := false
	for _, err := range errors {
		if err == expectedError ||
			len(err) > len(expectedError) && err[len(err)-len(expectedError):] == expectedError {
			found = true
			break
		}
	}

	if !found {
		t.Errorf("Expected error message '%s', but got: %v", expectedError, errors)
	}

	fmt.Printf("Correctly caught error: %v\n", errors)
}

func TestDeferInsideNestedFunction(t *testing.T) {
	input := `
	function outer() {
		function inner() {
			defer {
				console.log("This should work")
			}
		}
	}`
	l := lexer.New(input)
	p := parser.New(l)
	p.UseStatementHandler(ParseDeferStatement)
	_ = p.ParseProgram() // Parse to check for errors

	errors := p.Errors()
	if len(errors) > 0 {
		t.Errorf("Expected no errors for defer inside nested function, but got: %v", errors)
	}

	fmt.Println("Nested function defer parsed successfully")
}
