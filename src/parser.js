import * as acorn from 'acorn'
import * as recast from 'recast'
import { getClosestPath, error } from './libs/utils.js'
import { buildDefersPushStatement, buildTryFinallyWrapper } from './builders.js'

/**
 * @param {typeof acorn.Parser} BaseParser
 */
const DeferParser = acorn.Parser.extend((BaseParser) => {
  return class extends BaseParser {
    parseStatement(context, topLevel, exports) {
      if (this.isContextual('defer')) {
        const node = this.startNode()
        node.isDefer = true
        this.next() // consumes `defer`
        const stmt = this.parseStatement()
        if (stmt.type == 'BlockStatement') {
          node.body = stmt
        } else if (stmt.type == 'ExpressionStatement') {
          node.body = this.startNodeAt(stmt.start)
          node.body.body = [stmt]
          this.finishNode(node.body, 'BlockStatement')
        } else {
          this.unexpected()
        }
        this.finishNode(node, 'LabeledStatement')

        return node
      }

      return super.parseStatement(context, topLevel, exports)
    }
  }
})

/**
 * @param {acorn.Program} ast
 * @returns {acorn.Program}
 */
const deferVisitor = (ast) => {
  const suffix = Math.random().toString(36).slice(2)
  const hasDefers = (body) => {
    let found = false

    recast.visit(body, {
      visitLabeledStatement(path) {
        const node = path.node
        if (node.body.type === 'BlockStatement' && node.isDefer) {
          found = true
          return false
        }
        this.traverse(path)
      },

      // Don't traverse into nested functions
      visitFunctionDeclaration() {
        return false
      },
      visitFunctionExpression() {
        return false
      },
      visitArrowFunctionExpression() {
        return false
      },
    })

    return found
  }

  return recast.visit(ast, {
    // overridden methods
    visitLabeledStatement(path) {
      const node = path.node
      if (node.body.type == 'BlockStatement' && node.isDefer) {
        const parentPath = getClosestPath(path, [
          'FunctionDeclaration',
          'FunctionExpression',
          'ArrowFunctionExpression',
        ])

        if (!parentPath) {
          error('defer statements are not allowed at top-level', node)
        }

        path.replace(buildDefersPushStatement(node.body, suffix))
      }
      return this.traverse(path)
    },
    visitFunctionDeclaration(path) {
      this.visitFunction(path)
    },
    visitFunctionExpression(path) {
      this.visitFunction(path)
    },
    visitArrowFunctionExpression(path) {
      this.visitFunction(path)
    },

    // custom methods
    visitFunction(path) {
      const node = path.node
      const bodyHasDefers = hasDefers(node.body)

      if (bodyHasDefers) {
        node.body = buildTryFinallyWrapper(node.body.body, suffix)
      }

      return this.traverse(path)
    },
  })
}

/**
 * @param {string} input
 * @param {acorn.Options} options
 * @returns {acorn.Program}
 */
export const parse = (input, options = { ecmaVersion: 'latest' }) => {
  return deferVisitor(DeferParser.parse(input, options))
}
