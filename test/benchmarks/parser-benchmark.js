#!/usr/bin/env node

/**
 * Performance benchmarks for XJS parser
 *
 * Run with: node test/benchmarks/parser-benchmark.js
 */

import { performance } from 'perf_hooks'
import { parse as parseDefer } from '../../src/defer/index.js'

/**
 * Simple benchmark runner
 * @param {string} name - Benchmark name
 * @param {Function} fn - Function to benchmark
 * @param {number} iterations - Number of iterations
 */
function benchmark(name, fn, iterations = 1000) {
  console.log(`🔬 Running benchmark: ${name}`)

  // Warm up
  for (let i = 0; i < 10; i++) {
    fn()
  }

  // Measure
  const start = performance.now()
  for (let i = 0; i < iterations; i++) {
    fn()
  }
  const end = performance.now()

  const totalTime = end - start
  const avgTime = totalTime / iterations

  console.log(`   Total time: ${totalTime.toFixed(2)}ms`)
  console.log(`   Average time: ${avgTime.toFixed(4)}ms per operation`)
  console.log(`   Operations per second: ${(1000 / avgTime).toFixed(0)}`)
  console.log()
}

// Sample code to parse
const simpleDefer = `
function test() {
  defer { console.log('cleanup') }
}
`

const complexDefer = `
function complex() {
  const db = createConnection()
  defer { db.close() }
  
  const file = openFile()
  defer { file.close() }
  
  const lock = acquireLock()
  defer { lock.release() }
  
  return processData()
}
`

// Run benchmarks
console.log('🚀 XJS Parser Benchmarks\n')

benchmark(
  'Simple defer parsing',
  () => {
    parseDefer(simpleDefer)
  },
  1000
)

benchmark(
  'Complex defer parsing',
  () => {
    parseDefer(complexDefer)
  },
  1000
)

benchmark(
  'Large code with defers',
  () => {
    const largeCode = Array(10).fill(complexDefer).join('\n')
    parseDefer(largeCode)
  },
  100
)

console.log('✅ Benchmarks completed!')
