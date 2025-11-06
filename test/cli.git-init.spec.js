import { describe, it, expect, vi, beforeEach } from 'vitest'

// 先 mock 出 utils，再导入 CLI，确保 CLI 使用的是被 mock 的 executeCommand
vi.mock('../lib/utils.js', async () => {
  const fn = vi.fn().mockResolvedValue({ stdout: '', stderr: '' })
  return {
    executeCommand: fn,
    checkDirectoryExists: vi.fn().mockResolvedValue(false),
    validateProjectName: (n) => true,
  }
})

import { CLI } from '../lib/cli.js'
import { executeCommand } from '../lib/utils.js'

describe('CLI git initialization behavior', () => {
  let cli
  const targetDir = '/tmp/test-astro-cli'

  beforeEach(() => {
    cli = new CLI()
    // 避免真实文件操作，stub 掉模板复制
    cli.templateProcessor.copyTemplate = vi.fn().mockResolvedValue(undefined)
    // 清理之前的调用记录
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

    // 验证执行了 git init
    expect(executeCommand).toHaveBeenCalledWith('git init', { cwd: targetDir })

    // 确认没有执行 git add/commit
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

