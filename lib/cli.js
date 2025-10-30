import path from 'path';
import { fileURLToPath } from 'url';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { TemplateProcessor } from './template.js';
import { validateProjectName, executeCommand, checkDirectoryExists } from './utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CLI {
  constructor() {
    this.templateProcessor = new TemplateProcessor();
  }

  async run(args) {
    console.log(chalk.cyan('🚀 Create Astro Exe'));
    console.log(chalk.gray('Creating a new Astro application...\n'));

    // 解析项目名称
    let projectName = args[0];
    
    if (!projectName) {
      const { name } = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'What is your project name?',
          default: 'my-astro-app',
          validate: validateProjectName
        }
      ]);
      projectName = name;
    } else {
      // 验证命令行提供的项目名
      const validation = validateProjectName(projectName);
      if (validation !== true) {
        console.error(chalk.red(`Error: ${validation}`));
        process.exit(1);
      }
    }

    const targetDir = path.resolve(process.cwd(), projectName);

    // 检查目录是否存在
    if (await checkDirectoryExists(targetDir)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Directory ${chalk.cyan(projectName)} already exists. Overwrite?`,
          default: false
        }
      ]);

      if (!overwrite) {
        console.log(chalk.yellow('Operation cancelled.'));
        process.exit(0);
      }
    }

    // 获取项目配置
    const config = await this.promptConfig(projectName);

    // 创建项目
    await this.createProject(targetDir, config);

    // 显示完成信息
    this.showCompletionMessage(projectName);
  }

  async promptConfig(projectName) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Project description:',
        default: 'My awesome Astro application'
      },
      {
        type: 'input',
        name: 'author',
        message: 'Author name:',
        default: ''
      },
      {
        type: 'confirm',
        name: 'installDeps',
        message: 'Install dependencies?',
        default: true
      },
      {
        type: 'confirm',
        name: 'initGit',
        message: 'Initialize git repository?',
        default: true
      }
    ]);

    return {
      projectName,
      ...answers
    };
  }

  async createProject(targetDir, config) {
    const spinner = ora('Creating project...').start();

    try {
      // 获取模板目录
      const templateDir = path.resolve(__dirname, '../template');

      // 复制模板文件
      spinner.text = 'Copying template files...';
      await this.templateProcessor.copyTemplate(templateDir, targetDir, config);

      // 安装依赖
      if (config.installDeps) {
        spinner.text = 'Installing dependencies...';
        await executeCommand('npm install', { cwd: targetDir });
      }

      // 初始化 Git
      if (config.initGit) {
        spinner.text = 'Initializing git repository...';
        await executeCommand('git init', { cwd: targetDir });
        await executeCommand('git add .', { cwd: targetDir });
        await executeCommand('git commit -m "Initial commit"', { cwd: targetDir });
      }

      spinner.succeed('Project created successfully!');
    } catch (error) {
      spinner.fail('Failed to create project');
      throw error;
    }
  }

  showCompletionMessage(projectName) {
    console.log();
    console.log(chalk.green('✨ Project created successfully!'));
    console.log();
    console.log('Next steps:');
    console.log(chalk.cyan(`  cd ${projectName}`));
    console.log(chalk.cyan('  npm run dev'));
    console.log();
    console.log('Happy coding! 🎉');
  }
}