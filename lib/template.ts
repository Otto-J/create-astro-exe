import path from 'node:path'
import fs from 'fs-extra'

export class TemplateProcessor {
  async copyTemplate(templateDir: string, targetDir: string, variables: Record<string, string> = {}): Promise<void> {
    await fs.ensureDir(targetDir)

    const items = await fs.readdir(templateDir)

    for (const item of items) {
      const srcPath = path.join(templateDir, item)
      const stat = await fs.stat(srcPath)

      if (stat.isDirectory()) {
        const targetSubDir = path.join(targetDir, item)
        await fs.ensureDir(targetSubDir)
        await this.copyTemplate(srcPath, targetSubDir, variables)
      }
      else {
        // 处理特殊文件和 .template 后缀
        let targetName = item

        if (item.endsWith('.template')) {
          // 通用模板文件：去掉 .template 后缀
          targetName = item.slice(0, -'.template'.length)
        }

        const targetPath = path.join(targetDir, targetName)

        // 对 JSON/Markdown 文件进行变量替换，其它文件原样复制
        if (targetName.endsWith('.json') || targetName.endsWith('.md')) {
          const content = await fs.readFile(srcPath, 'utf-8')
          const processedContent = this.replaceVariables(content, variables)
          await fs.writeFile(targetPath, processedContent)
        }
        else {
          await fs.copy(srcPath, targetPath)
        }
      }
    }
  }

  private replaceVariables(content: string, variables: Record<string, string>): string {
    let result = content

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g')
      result = result.replace(regex, value || '')
    }

    return result
  }
}
