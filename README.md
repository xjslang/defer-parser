## defer for JavaScript

El propósito de esta librería es incorporar la estructura `defer`, presente en
lenguajes como V o Go, al languaje JavaScript.

Para ello usaremos las librerías `acorn` y `recast`.

# habla de las librerías `acorn` y `recast`

La librería `acorn` es un parser flexible de JavaScript que, entre otras cosas,
nos permitirá incorporar estructuras nuevas al propio lenguaje (en nuestro caso,
la estructura `defer`).

`acorn` generará un AST (Abstract Sintax Tree) que será recorrido por la librería
`recast`, encargada de transformar al AST original a un nuevo AST que representará
el árbol final.

(dibuja un diagrama)

código fuente --(acorn)--> AST compatible con ESTree --(recast)--> AST compatible con ESTree

Es importante notar que en cada paso generamos un AST compatible con ESTree. El último AST será el que
usemos para imprimir el código resultante.

## Para qué necesitamos `recast`? No es suficiente con `acorn`?

La librería `recast` nos permitirá recorrer el AST por segunda vez, generando los nodos finales. Por ejemplo,
en la segunda pasada podría determinar si una función utiliza `defer` en su cuerpo y de esta forma incluir
las estructuras necesarias. Eso es algo que no podemos determinar en una única pasada.

# instalación, pruebas, etc..

# cómo contribuir al código

# lo que consideres conveniente
