import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../lib/utils', async () => {
  const fn = vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
  return {
    executeCommand: fn,
    checkDirectoryExists: vi.fn().mockResolvedValue(false),
    validateProjectName: (n: string): true | string => true,
  }
})

import { CLI } from '../lib/cli'
import { executeCommand } from '../lib/utils'

describe('CLI git initialization behavior', () => {
  let cli: CLI
  const targetDir = '/tmp/test-astro-cli'

  beforeEach(() => {
    cli = new CLI()
    cli.templateProcessor.copyTemplate = vi.fn().mockResolvedValue(undefined)
    executeCommand.mockClear()
  })

  it('initGit 为 true 时仅执行 "git init"，不执行 add/commit', async () => {
    await cli.createProject(targetDir, {
      projectName: 'demo',
      description: '',
      author: '',
      installDeps: false,
      initGit: true,
    })

    expect(executeCommand).toHaveBeenCalledWith('git init', { cwd: targetDir })

    const calls = executeCommand.mock.calls.map(args => args[0])
    expect(calls.some(cmd => cmd.startsWith('git add'))).toBe(false)
    expect(calls.some(cmd => cmd.startsWith('git commit'))).toBe(false)
  })

  it('initGit 为 false 时不执行任何 git 命令', async () => {
    await cli.createProject(targetDir, {
      projectName: 'demo',
      description: '',
      author: '',
      installDeps: false,
      initGit: false,
    })

    const calls = executeCommand.mock.calls.map(args => args[0])
    expect(calls.some(cmd => cmd.startsWith('git'))).toBe(false)
  })
})
