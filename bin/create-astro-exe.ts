#!/usr/bin/env node

import { CLI } from '../lib/cli'

async function main(): Promise<void> {
  try {
    const cli = new CLI()
    await cli.run(process.argv.slice(2))
  }
  catch (error) {
    console.error('Error:', (error as Error).message)
    process.exit(1)
  }
}

main()
