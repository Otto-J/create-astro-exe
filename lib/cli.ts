import path from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import inquirer from 'inquirer'
import ora from 'ora'
import { TemplateProcessor } from './template'
import { checkDirectoryExists, executeCommand, validateProjectName, isDirectoryEmpty } from './utils'
import fs from 'fs-extra'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface ProjectConfig {
  projectName: string
  description: string
  author: string
  installDeps: boolean
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'bun'
  initGit: boolean
  useTaobaoRegistry?: boolean
}

export class CLI {
  public templateProcessor: TemplateProcessor

  constructor() {
    this.templateProcessor = new TemplateProcessor()
  }

  async run(args: string[]): Promise<void> {
    console.log(chalk.cyan('🚀 Create Astro Exe'))
    console.log(chalk.gray('Creating a new Astro application...\n'))

    let projectName = args[0]

    if (!projectName) {
      const { name } = await inquirer.prompt<{ name: string }>([
        {
          type: 'input',
          name: 'name',
          message: 'What is your project name?',
          default: 'my-astro-app',
          validate: validateProjectName,
        },
      ])
      projectName = name
    }
    else {
      const validation = validateProjectName(projectName)
      if (validation !== true) {
        console.error(chalk.red(`Error: ${validation}`))
        process.exit(1)
      }
    }

    let targetDir = path.resolve(process.cwd(), projectName)

    const cwdEmpty = await isDirectoryEmpty(process.cwd())
    if (cwdEmpty) {
      const { useCurrentDir } = await inquirer.prompt<{ useCurrentDir: boolean }>([
        {
          type: 'confirm',
          name: 'useCurrentDir',
          message: 'Detected empty current directory. Initialize project here?',
          default: true,
        },
      ])
      if (useCurrentDir) {
        targetDir = process.cwd()
      }
    }

    if (targetDir !== process.cwd()) {
      if (await checkDirectoryExists(targetDir)) {
        const { overwrite } = await inquirer.prompt<{ overwrite: boolean }>([
          {
            type: 'confirm',
            name: 'overwrite',
            message: `Directory ${chalk.cyan(projectName)} already exists. Overwrite?`,
            default: false,
          },
        ])

        if (!overwrite) {
          console.log(chalk.yellow('Operation cancelled.'))
          process.exit(0)
        }
      }
    }

    const config = await this.promptConfig(projectName)

    await this.createProject(targetDir, config)

    this.showCompletionMessage(projectName, config.installDeps ? config.packageManager : undefined)
  }

  private async promptConfig(projectName: string): Promise<ProjectConfig> {
    let defaultAuthor = ''
    try {
      const { stdout } = await executeCommand('git config --global user.name')
      defaultAuthor = stdout.trim()
    }
    catch {}

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'useTaobaoRegistry',
        message: 'Use Taobao registry mirror to speed up installs?',
        default: true,
        when: (answers: any) => answers.installDeps === true,
      },
      {
        type: 'list',
        name: 'packageManager',
        message: 'Choose a package manager:',
        choices: ['npm', 'yarn', 'pnpm', 'bun'],
        default: 'npm',
        when: (answers: any) => answers.installDeps === true,
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: 'Initialize git repository?',
        default: true,
      },
    ])

    return {
      projectName,
      description: `${projectName} - Astro application`,
      author: defaultAuthor || '',
      ...answers,
    }
  }

  public async createProject(targetDir: string, config: ProjectConfig): Promise<void> {
    const spinner = ora('Creating project...').start()

    try {
      const templateDir = path.resolve(__dirname, '../template')

      spinner.text = 'Copying template files...'
      await this.templateProcessor.copyTemplate(templateDir, targetDir, {
        projectName: config.projectName,
        description: config.description,
        author: config.author,
      })
      if (config.installDeps && config.useTaobaoRegistry === false) {
        try {
          await fs.remove(path.join(targetDir, '.npmrc'))
        }
        catch {}
      }

      if (config.installDeps) {
        spinner.text = 'Installing dependencies...'
        const pm = config.packageManager || 'npm'
        let installCmd = pm === 'yarn' ? 'yarn' : pm === 'bun' ? 'bun install' : `${pm} install`
        if (config.useTaobaoRegistry && (pm === 'npm' || pm === 'pnpm')) {
          installCmd = `${installCmd} --registry https://registry.npmmirror.com/`
        }
        await executeCommand(installCmd, { cwd: targetDir })
      }

      if (config.initGit) {
        spinner.text = 'Initializing git repository...'
        await executeCommand('git init', { cwd: targetDir })
        try {
          await executeCommand('git add -A', { cwd: targetDir })
          await executeCommand('git commit -m "feat: init"', { cwd: targetDir })
        }
        catch {}
      }

      spinner.succeed('Project created successfully!')
    }
    catch (error) {
      spinner.fail('Failed to create project')
      throw error
    }
  }

  private showCompletionMessage(projectName: string, pm?: 'npm' | 'yarn' | 'pnpm' | 'bun'): void {
    console.log()
    console.log(chalk.green('✨ Project created successfully!'))
    console.log()
    console.log('Next steps:')
    console.log(chalk.cyan(`  cd ${projectName}`))
    if (pm) {
      console.log(chalk.cyan(`  ${pm} run dev`))
    }
    else {
      console.log(chalk.cyan('  npm/yarn/pnpm/bun run dev'))
    }
    console.log()
    console.log('Happy coding! 🎉')
  }
}
