#!/usr/bin/env node

import { build } from 'esbuild'
import { promises as fs } from 'fs'
import path from 'path'
import { glob } from 'glob'

async function getFilteredEntryPoints() {
  const srcFiles = await glob('src/**/*.js', {
    ignore: ['**/*.test.js', '**/*.spec.js'],
  })

  return [...srcFiles, 'index.js']
}

async function buildESM() {
  console.log('Building ESM...')
  const entryPoints = await getFilteredEntryPoints()
  console.log('Entry points:', entryPoints)

  await build({
    entryPoints,
    outdir: 'dist/esm',
    format: 'esm',
    platform: 'node',
    target: 'node16',
    sourcemap: true,
    bundle: false,
    preserveSymlinks: false,
    keepNames: true,
  })
}

async function buildCJS() {
  console.log('Building CommonJS...')
  const entryPoints = await getFilteredEntryPoints()

  await build({
    entryPoints,
    outdir: 'dist/cjs',
    format: 'cjs',
    platform: 'node',
    target: 'node16',
    sourcemap: true,
    bundle: false,
    preserveSymlinks: false,
    keepNames: true,
  })
}

async function createPackageJson() {
  console.log('Creating package.json files...')

  // Create package.json for ESM
  const esmDir = 'dist/esm'
  await fs.mkdir(esmDir, { recursive: true })
  await fs.writeFile(
    path.join(esmDir, 'package.json'),
    JSON.stringify({ type: 'module' }, null, 2)
  )

  // Create package.json for CJS
  const cjsDir = 'dist/cjs'
  await fs.mkdir(cjsDir, { recursive: true })
  await fs.writeFile(
    path.join(cjsDir, 'package.json'),
    JSON.stringify({ type: 'commonjs' }, null, 2)
  )
}

async function main() {
  try {
    await Promise.all([buildESM(), buildCJS(), createPackageJson()])
    console.log('✅ Build completed successfully!')
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

main()
