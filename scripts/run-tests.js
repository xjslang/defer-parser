#!/usr/bin/env node

import { readFileSync, readdirSync, writeFileSync, unlinkSync } from 'fs'
import { join, basename, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'
import recast from 'recast'
import { parse } from '../src/index.js'

// Get the directory path of this file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const FIXTURES_DIR = join(__dirname, '../test', 'fixtures')

/**
 * Execute code and capture console output
 * @param {string} code - Code to execute
 * @returns {string[]} Array of output lines
 */
function executeCode(code) {
  const tempFile = join(process.cwd(), `temp-test-${Date.now()}.js`)

  try {
    writeFileSync(tempFile, code)
    const output = execSync(`node ${tempFile}`, { encoding: 'utf8' })
    return output
      .trim()
      .split('\n')
      .filter((line) => line.length > 0)
  } catch (error) {
    throw new Error(`Execution failed: ${error.message}`)
  } finally {
    try {
      unlinkSync(tempFile)
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Run tests in fixtures directory
 * @param {string[]} specificTests - Optional array of specific test names to run
 */
function runTests(specificTests = []) {
  const files = readdirSync(FIXTURES_DIR)
  let testFiles = files.filter((file) => file.endsWith('.xjs'))

  // Filter to specific tests if provided
  if (specificTests.length > 0) {
    testFiles = testFiles.filter((file) => {
      const testName = basename(file, '.xjs')
      return specificTests.includes(testName)
    })

    if (testFiles.length === 0) {
      console.log(`❌ No tests found matching: ${specificTests.join(', ')}`)
      console.log(
        `Available tests: ${files
          .filter((f) => f.endsWith('.xjs'))
          .map((f) => basename(f, '.xjs'))
          .join(', ')}`
      )
      process.exit(1)
    }
  }

  let passed = 0
  let total = 0

  const testHeader =
    specificTests.length > 0
      ? `🚀 Running specific XJS tests: ${specificTests.join(', ')}\n`
      : '🚀 Running XJS behavior tests...\n'

  console.log(testHeader)

  for (const testFile of testFiles) {
    const testName = basename(testFile, '.xjs')
    const xjsPath = join(FIXTURES_DIR, testFile)
    const outPath = join(FIXTURES_DIR, `${testName}.out`)

    total++

    try {
      // Read input and expected output
      const inputCode = readFileSync(xjsPath, 'utf8')
      const expectedOutput = readFileSync(outPath, 'utf8')
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)

      let actualOutput
      let generatedCode = null

      try {
        // Parse and generate code
        const ast = parse(inputCode)
        const result = recast.print(ast)
        generatedCode = result.code

        if (process.argv.includes('--verbose')) {
          console.log(`🔍 Processing ${testName}`)
          console.log(`Generated code:\n${generatedCode}`)
          console.log('='.repeat(50))
        }

        // Execute and capture output
        actualOutput = executeCode(generatedCode)
      } catch (parseError) {
        // Handle parsing errors (like defer at top-level)
        actualOutput = [parseError.message]

        if (process.argv.includes('--verbose')) {
          console.log(`🔍 Processing ${testName}`)
          console.log(`Parse error: ${parseError.message}`)
          console.log('='.repeat(50))
        }
      }

      // Compare results
      const success =
        JSON.stringify(actualOutput) === JSON.stringify(expectedOutput)

      if (success) {
        console.log(`✅ ${testName}`)
        passed++
      } else {
        console.log(`❌ ${testName}`)
        console.log(`   Expected: ${JSON.stringify(expectedOutput)}`)
        console.log(`   Actual:   ${JSON.stringify(actualOutput)}`)
        if (process.argv.includes('--verbose') && generatedCode) {
          console.log(`   Generated code:\n${generatedCode}`)
        }
      }
    } catch (error) {
      console.log(`💥 ${testName} - ERROR: ${error.message}`)

      // Show generated code for execution errors to help debugging
      try {
        const inputCode = readFileSync(xjsPath, 'utf8')
        const ast = parse(inputCode)
        const result = recast.print(ast)
        console.log(`   Generated code:\n${result.code}`)
      } catch {
        // Ignore parsing errors when trying to show generated code
      }
    }
  }

  console.log(`\n📊 Results: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log('🎉 All tests passed!')
    process.exit(0)
  } else {
    console.log('❌ Some tests failed')
    process.exit(1)
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const options = {
    verbose: false,
    help: false,
    tests: [],
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--verbose' || arg === '-v') {
      options.verbose = true
    } else if (arg === '--help' || arg === '-h') {
      options.help = true
    } else if (arg === '--test' || arg === '-t') {
      // Next argument should be the test name
      if (i + 1 < args.length) {
        options.tests.push(args[i + 1])
        i++ // Skip next argument
      }
    } else if (!arg.startsWith('-')) {
      // Treat non-flag arguments as test names
      options.tests.push(arg)
    }
  }

  return options
}

// Show help message
function showHelp() {
  console.log(`
🧪 XJS Test Runner

Usage: node scripts/run-tests.js [options] [test-names...]

Options:
  --verbose, -v        Show detailed output including generated code
  --test, -t <name>    Run specific test by name
  --help, -h           Show this help message

Examples:
  node scripts/run-tests.js                    # Run all tests
  node scripts/run-tests.js --verbose          # Run all tests with verbose output
  node scripts/run-tests.js defer-top-level    # Run specific test
  node scripts/run-tests.js -t defer-closures  # Run specific test (alternative syntax)
  node scripts/run-tests.js defer-top defer-closures  # Run multiple specific tests
  
Available tests:
`)

  try {
    const files = readdirSync(FIXTURES_DIR)
    const testNames = files
      .filter((file) => file.endsWith('.xjs'))
      .map((file) => basename(file, '.xjs'))
      .sort()

    testNames.forEach((name) => console.log(`  - ${name}`))
  } catch {
    console.log('  (Could not list available tests)')
  }

  console.log()
}

// Main execution
const options = parseArgs()

if (options.help) {
  showHelp()
  process.exit(0)
}

// Set verbose mode if requested
if (options.verbose) {
  process.argv.push('--verbose')
}

runTests(options.tests)
