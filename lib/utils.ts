import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'fs-extra'

const execAsync = promisify(exec)

export function validateProjectName(name: string): true | string {
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

export async function checkDirectoryExists(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath)
    return stat.isDirectory()
  } catch {
    return false
  }
}

export async function executeCommand(command: string, options: { cwd?: string } = {}): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execAsync(command, options)
    return { stdout, stderr }
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${(error as Error).message}`)
  }
}

export function formatPackageName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function getCurrentTimestamp(): string {
  return new Date().toISOString()
}
