import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'fs-extra'

const execAsync = promisify(exec)

/**
 * 验证项目名称
 */
export function validateProjectName(name) {
  if (!name) {
    return 'Project name is required'
  }

  if (!/^[\w-]+$/.test(name)) {
    return 'Project name can only contain letters, numbers, hyphens, and underscores'
  }

  if (name.length < 1 || name.length > 50) {
    return 'Project name must be between 1 and 50 characters'
  }

  return true
}

/**
 * 检查目录是否存在
 */
export async function checkDirectoryExists(dirPath) {
  try {
    const stat = await fs.stat(dirPath)
    return stat.isDirectory()
  }
  catch {
    return false
  }
}

/**
 * 执行命令
 */
export async function executeCommand(command, options = {}) {
  try {
    const { stdout, stderr } = await execAsync(command, options)
    return { stdout, stderr }
  }
  catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`)
  }
}

/**
 * 格式化项目名称为合法的包名
 */
export function formatPackageName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * 获取当前时间戳
 */
export function getCurrentTimestamp() {
  return new Date().toISOString()
}
