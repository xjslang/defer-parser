import { builders as b } from 'ast-types'
import { createId } from './libs/utils.js'

// defers.push(() => [body])
export function buildDefersPushStatement(body, suffix) {
  const defersVarName = createId('defers', suffix)

  return b.expressionStatement(
    b.callExpression(
      b.memberExpression(
        b.identifier(defersVarName),
        b.identifier('push'),
        false
      ),
      [b.arrowFunctionExpression([], body, false)]
    )
  )
}

// try {
//     const defers = [];
//     [body]
// } finally {
//     for (let i = defers.length - 1; i >= 0; i --) {
//         try {
//             defers[i]();
//         } catch(err) {
//             console.error(err);
//         }
//     }
// }
export function buildTryFinallyWrapper(body, suffix) {
  const defersVarName = createId('defers', suffix)
  const idVarName = createId('i', suffix)
  const errVarName = createId('err', suffix)

  return b.blockStatement([
    // const defers = [];
    b.variableDeclaration('const', [
      b.variableDeclarator(b.identifier(defersVarName), b.arrayExpression([])),
    ]),
    b.tryStatement(
      b.blockStatement([...body]),
      null,
      b.blockStatement([
        // for (let i = defers.length - 1; i >= 0; i --) {
        b.forStatement(
          b.variableDeclaration('let', [
            b.variableDeclarator(
              b.identifier(idVarName),
              b.binaryExpression(
                '-',
                b.memberExpression(
                  b.identifier(defersVarName),
                  b.identifier('length'),
                  false
                ),
                b.literal(1)
              )
            ),
          ]),
          b.binaryExpression('>=', b.identifier(idVarName), b.literal(0)),
          b.updateExpression('--', b.identifier(idVarName), false),
          b.blockStatement([
            b.tryStatement(
              // try { defers[i](); }
              b.blockStatement([
                b.expressionStatement(
                  b.callExpression(
                    b.memberExpression(
                      b.identifier(defersVarName),
                      b.identifier(idVarName),
                      true
                    ),
                    []
                  )
                ),
              ]),
              // catch(err) { console.log('Error: ' + err.message); }
              b.catchClause(
                b.identifier(errVarName),
                null,
                b.blockStatement([
                  b.expressionStatement(
                    b.callExpression(
                      b.memberExpression(
                        b.identifier('console'),
                        b.identifier('log'),
                        false
                      ),
                      [
                        b.binaryExpression(
                          '+',
                          b.literal('Error: '),
                          b.memberExpression(
                            b.identifier(errVarName),
                            b.identifier('message'),
                            false
                          )
                        ),
                      ]
                    )
                  ),
                ])
              )
            ),
          ])
        ),
      ])
    ),
  ])
}
