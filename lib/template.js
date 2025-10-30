import fs from 'fs-extra';
import path from 'path';

export class TemplateProcessor {
  async copyTemplate(templateDir, targetDir, variables = {}) {
    // 确保目标目录存在
    await fs.ensureDir(targetDir);
    
    const items = await fs.readdir(templateDir);
    
    for (const item of items) {
      const srcPath = path.join(templateDir, item);
      const stat = await fs.stat(srcPath);
      
      if (stat.isDirectory()) {
        const targetSubDir = path.join(targetDir, item);
        await fs.ensureDir(targetSubDir);
        await this.copyTemplate(srcPath, targetSubDir, variables);
      } else {
        let targetName = item;
        let targetPath = path.join(targetDir, targetName);
        
        // Handle special file name mappings
        if (item === 'gitignore.template') {
          targetName = '.gitignore';
          targetPath = path.join(targetDir, targetName);
        } else if (item.endsWith('.template')) {
          // Remove .template extension
          targetName = item.replace(/\.template$/, '');
          targetPath = path.join(targetDir, targetName);
        }
        
        if (item.endsWith('.template') || item === 'gitignore.template') {
          // Process template file with variable replacement
          const content = await fs.readFile(srcPath, 'utf-8');
          const processedContent = this.replaceVariables(content, variables);
          await fs.writeFile(targetPath, processedContent);
        } else {
          // Copy file as-is
          await fs.copy(srcPath, targetPath);
        }
      }
    }
  }

  replaceVariables(content, variables) {
    let result = content;

    // 替换所有 {{variableName}} 格式的变量
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value || '');
    }

    return result;
  }
}