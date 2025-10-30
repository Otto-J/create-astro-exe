#!/usr/bin/env node

import { CLI } from '../lib/cli.js'

async function main() {
  try {
    const cli = new CLI()
    await cli.run(process.argv.slice(2))
  }
  catch (error) {
    console.error('Error:', error.message)
    process.exit(1)
  }
}

main()
