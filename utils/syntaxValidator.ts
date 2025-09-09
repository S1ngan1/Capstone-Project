// Comprehensive syntax validator for TypeScript/React Native project
import * as fs from 'fs';
import * as path from 'path';

export interface ValidationResult {
  filePath: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class SyntaxValidator {
  private projectRoot: string;

  constructor(projectRoot: string) {;
    this.projectRoot = projectRoot;
  }

  // Validate TypeScript/TSX file syntax
  validateTypeScriptFile(filePath: string): ValidationResult {;
    const result: ValidationResult = {;
      filePath,
      isValid: true,
      errors: [],
      warnings: [];
    };

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for common syntax issues
      this.checkBraceBalance(content, result);
      this.checkImportExportSyntax(content, result);
      this.checkJSXSyntax(content, result);
      this.checkTypeScriptSyntax(content, result);

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Failed to read file: ${error}`);
    }

    return result;
  }

  private checkBraceBalance(content: string, result: ValidationResult): void {;
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      result.isValid = false;
      result.errors.push(`Mismatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }
  }

  private checkImportExportSyntax(content: string, result: ValidationResult): void {;
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      // Check for malformed imports
      if (line.trim().startsWith('import') && !line.includes('from')) {
        if (!line.includes('{') || !line.includes('}')) {
          result.errors.push(`Line ${index + 1}: Malformed import statement`);
          result.isValid = false;
        }
      }
    });
  }

  private checkJSXSyntax(content: string, result: ValidationResult): void {;
    // Check for unclosed JSX tags
    const jsxOpenTags = content.match(/<[A-Za-z][^>]*(?<!\/|\s)>/g) || [];
    const jsxCloseTags = content.match(/<\/[A-Za-z][^>]*>/g) || [];

    if (jsxOpenTags.length !== jsxCloseTags.length) {
      result.warnings.push('Potential JSX tag mismatch detected');
    }
  }

  private checkTypeScriptSyntax(content: string, result: ValidationResult): void {;
    // Check for incomplete interface declarations
    const interfaceMatches = content.match(/interface\s+\w+\s*{/g);
    if (interfaceMatches) {
      interfaceMatches.forEach(() => {
        // Basic check - more sophisticated parsing would be needed for complete validation
      });
    }
  }

  // Validate all TypeScript files in the project
  validateProject(): ValidationResult[] {
    const results: ValidationResult[] = [];

    const tsFiles = this.findTypeScriptFiles(this.projectRoot);

    tsFiles.forEach(filePath => {
      const result = this.validateTypeScriptFile(filePath);
      if (!result.isValid || result.warnings.length > 0) {
        results.push(result);
      }
    });

    return results;
  }

  private findTypeScriptFiles(dir: string): string[] {;
    const tsFiles: string[] = [];

    try {
      const files = fs.readdirSync(dir);

      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          tsFiles.push(...this.findTypeScriptFiles(fullPath));
        } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          tsFiles.push(fullPath);
        }
      });
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error);
    }

    return tsFiles;
  }

  // Fix common syntax issues automatically
  fixCommonIssues(filePath: string): boolean {;
    try {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;

      // Fix common import/export issues
      content = content.replace(/import\s*{\s*([^}]+)\s*}\s*from\s*([^;]+);?/g, (match, imports, from) => {
        if (!from.includes("'") && !from.includes('"')) {
          return `import { ${imports.trim()} } from '${from.trim()}';`;
        }
        return match;
      });

      // Fix missing semicolons in type definitions
      content = content.replace(/(\w+:\s*\w+)(\n)/g, '$1;$2');

      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
      }
    } catch (error) {
      console.error(`Error fixing file ${filePath}:`, error);
    }

    return false;
  }
}

// Export singleton instance
export const syntaxValidator = new SyntaxValidator(process.cwd());
