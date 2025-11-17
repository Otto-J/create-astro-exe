import { beforeEach, describe, expect, it, vi } from 'vitest'

import { CLI } from '../lib/cli'
import { executeCommand } from '../lib/utils'

vi.mock('../lib/utils', async () => {
  const fn = vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
  return {
    executeCommand: fn,
    checkDirectoryExists: vi.fn().mockResolvedValue(false),
    validateProjectName: (_n: string): true | string => true,
  }
})

describe('cLI git initialization behavior', () => {
  let cli: CLI
  const targetDir = '/tmp/test-astro-cli'

  beforeEach(() => {
    cli = new CLI()
    cli.templateProcessor.copyTemplate = vi.fn().mockResolvedValue(undefined)
    // Use the mocked version with proper typings
    const mockedExecuteCommand = vi.mocked(executeCommand)
    mockedExecuteCommand.mockClear()
  })

  it('initGit 为 true 时执行 "git init"、"git add -A" 与一次初始 commit', async () => {
    await cli.createProject(targetDir, {
      projectName: 'demo',
      description: '',
      author: '',
      installDeps: false,
      initGit: true,
    })

    const mockedExecuteCommand = vi.mocked(executeCommand)
    expect(mockedExecuteCommand).toHaveBeenCalledWith('git init', { cwd: targetDir })
    const calls: string[] = mockedExecuteCommand.mock.calls.map((args: [string, { cwd?: string }?]) => args[0])
    expect(calls.includes('git add -A')).toBe(true)
    expect(calls.some(cmd => cmd.includes('git commit') && cmd.includes('feat: init'))).toBe(true)
  })

  it('initGit 为 false 时不执行任何 git 命令', async () => {
    await cli.createProject(targetDir, {
      projectName: 'demo',
      description: '',
      author: '',
      installDeps: false,
      initGit: false,
    })

    const mockedExecuteCommand = vi.mocked(executeCommand)
    const calls: string[] = mockedExecuteCommand.mock.calls.map((args: [string, { cwd?: string }?]) => args[0])
    expect(calls.some(cmd => cmd.startsWith('git'))).toBe(false)
  })
})
