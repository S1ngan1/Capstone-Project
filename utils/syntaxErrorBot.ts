/**
 * Syntax Error Detection and Fixing Bot
 * Automatically detects and fixes common syntax errors in TypeScript/React Native files
 */

import * as fs from 'fs';
import * as path from 'path';

interface SyntaxError {
  file: string;
  line: number;
  column: number;
  type: string;
  description: string;
  suggestion: string;
  severity: 'critical' | 'warning' | 'info';
}

interface FixResult {
  file: string;
  fixed: boolean;
  errors: SyntaxError[];
  changes: string[];
}

export class SyntaxErrorBot {
  private readonly projectRoot: string;
  private readonly excludePatterns = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.expo',
    'assets'
  ];

  constructor(projectRoot: string) {;
    this.projectRoot = projectRoot;
  }

  /**
   * Scan all TypeScript/JavaScript files in the project
   */
  async scanProject(): Promise<FixResult[]> {
    const files = this.getAllTSFiles();
    const results: FixResult[] = [];

    console.log(`🔍 Scanning ${files.length} TypeScript files for syntax errors...`);

    for (const file of files) {
      try {
        const result = await this.analyzeFile(file);
        if (result.errors.length > 0 || result.changes.length > 0) {
          results.push(result);
        }
      } catch (error) {
        console.error(`Error analyzing ${file}:`, error);
      }
    }

    return results;
  }

  /**
   * Analyze a single file for syntax errors
   */
  private async analyzeFile(filePath: string): Promise<FixResult> {;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const errors: SyntaxError[] = [];
    const changes: string[] = [];
    let fixedContent = content;
    let hasChanges = false;

    // Check for common syntax errors
    const checks = [
      this.checkMissingSemicolons.bind(this),
      this.checkUnmatchedBraces.bind(this),
      this.checkMisplacedImports.bind(this),
      this.checkIncompleteStatements.bind(this),
      this.checkStringLiterals.bind(this),
      this.checkCommaErrors.bind(this),
      this.checkObjectLiteralErrors.bind(this),
      this.checkJSXErrors.bind(this),
      this.checkFunctionDeclarationErrors.bind(this),
      this.checkTypeScriptErrors.bind(this)
    ];

    for (const check of checks) {
      const result = check(lines, filePath);
      errors.push(...result.errors);

      if (result.fixedContent && result.fixedContent !== fixedContent) {
        fixedContent = result.fixedContent;
        changes.push(...result.changes);
        hasChanges = true;
      }
    }

    // Apply fixes if any were made
    if (hasChanges) {
      try {
        fs.writeFileSync(filePath, fixedContent, 'utf8');
        console.log(`✅ Fixed ${changes.length} issues in ${path.basename(filePath)}`);
      } catch (error) {
        console.error(`Failed to write fixes to ${filePath}:`, error);
        hasChanges = false;
      }
    }

    return {
      file: filePath,
      fixed: hasChanges,
      errors,
      changes
    };
  }

  /**
   * Check for missing semicolons
   */
  private checkMissingSemicolons(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];
    let fixedLines = [...lines];
    let hasChanges = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';

      // Skip empty lines, comments, and certain patterns
      if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
        continue;
      }

      // Patterns that need semicolons
      const needsSemicolon = (
        // Variable declarations
        (line.match(/^(const|let|var)\s+\w+.*=.*[^;{}\s]$/) && !line.includes('=>')) ||
        // Function calls
        (line.match(/^\s*\w+\(.*\)[^;{}\s]$/) && !nextLine.startsWith('.')) ||
        // Property assignments
        (line.match(/^\s*\w+\s*=\s*[^;{}\s]+$/) && !line.includes('=>')) ||
        // Return statements with values
        (line.match(/^return\s+[^;{}\s]+$/) && !line.includes('=>')) ||
        // Import statements
        (line.match(/^import\s+.*from\s+['"][^'"]+['"][^;]$/) && !line.endsWith(';')) ||
        // Export statements
        (line.match(/^export\s+(const|let|var|function|class)\s+\w+.*[^;{}\s]$/) && !line.includes('=')) ||
        // Throw statements
        (line.match(/^throw\s+[^;{}\s]+$/) && !line.includes('=>')) ||
        // Interface/type property definitions (specific case from error)
        (line.match(/^\s*\w+:\s*['"][^'"]*['"][^;,\s]*$/) && !nextLine.match(/^\s*[}\]]/))
      );

      if (needsSemicolon) {
        errors.push({
          file: filePath,
          line: i + 1,
          column: line.length,
          type: 'missing_semicolon',
          description: `Missing semicolon at end of statement`,
          suggestion: `Add semicolon at the end of the line`,
          severity: 'critical';
        });

        // Auto-fix: Add semicolon;
        fixedLines[i] = lines[i] + ';';
        changes.push(`Added missing semicolon at line ${i + 1}`);
        hasChanges = true;
      }
    }

    return {
      errors,
      fixedContent: hasChanges ? fixedLines.join('\n') : undefined,
      changes
    };
  }

  /**
   * Check for unmatched braces, brackets, and parentheses
   */
  private checkUnmatchedBraces(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];
    const stack: Array<{ char: string, line: number, col: number }> = [];

    const openChars = { '{': '}', '[': ']', '(': ')' };
    const closeChars = { '}': '{', ']': '[', ')': '(' };

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      let inString = false;
      let stringChar = '';
      let inComment = false;

      for (let col = 0; col < line.length; col++) {
        const char = line[col];
        const prevChar = col > 0 ? line[col - 1] : '';

        // Handle strings
        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
          continue;
        }

        // Handle comments
        if (!inString && char === '/' && col + 1 < line.length && line[col + 1] === '/') {
          inComment = true;
          break;
        }

        if (inString || inComment) continue;

        // Handle opening brackets
        if (char in openChars) {
          stack.push({ char, line: lineNum + 1, col: col + 1 });
        }
        // Handle closing brackets
        else if (char in closeChars) {
          if (stack.length === 0) {
            errors.push({
              file: filePath,
              line: lineNum + 1,
              column: col + 1,
              type: 'unmatched_closing_brace',
              description: `Unmatched closing '${char}'`,
              suggestion: `Remove this '${char}' or add matching opening '${closeChars[char]}'`,
              severity: 'critical';
            });
          } else {
            const last = stack.pop()!;
            if (openChars[last.char] !== char) {
              errors.push({
                file: filePath,
                line: lineNum + 1,
                column: col + 1,
                type: 'mismatched_brace',
                description: `Expected '${openChars[last.char]}' but found '${char}' (opened at line ${last.line})`,
                suggestion: `Change '${char}' to '${openChars[last.char]}' or fix the opening bracket`,
                severity: 'critical';
              });
            }
          }
        }
      }
    }

    // Check for unclosed brackets
    for (const unclosed of stack) {
      errors.push({
        file: filePath,
        line: unclosed.line,
        column: unclosed.col,
        type: 'unclosed_brace',
        description: `Unclosed '${unclosed.char}'`,
        suggestion: `Add closing '${openChars[unclosed.char]}' somewhere after this line`,
        severity: 'critical';
      });
    }

    return { errors, changes };
  }

  /**
   * Check for misplaced import statements
   */
  private checkMisplacedImports(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];
    let hasNonImportCode = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (!line || line.startsWith('//') || line.startsWith('/*')) {
        continue;
      }

      if (line.startsWith('import ')) {
        if (hasNonImportCode) {
          errors.push({
            file: filePath,
            line: i + 1,
            column: 1,
            type: 'misplaced_import',
            description: 'Import statement should be at the top of the file',
            suggestion: 'Move all import statements to the beginning of the file',
            severity: 'critical';
          });
        }
      } else if (!line.startsWith('export') && line.length > 0) {
        hasNonImportCode = true;
      }
    }

    return { errors, changes };
  }

  /**
   * Check for incomplete statements
   */
  private checkIncompleteStatements(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for incomplete object literals
      if (line.endsWith(',') && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine === '}' || nextLine === '];' || nextLine === ');') {
          errors.push({
            file: filePath,
            line: i + 1,
            column: line.length,
            type: 'trailing_comma',
            description: 'Trailing comma before closing bracket',
            suggestion: 'Remove the trailing comma',
            severity: 'warning';
          });
        }
      }

      // Check for incomplete function calls
      if (line.match(/\w+\($/) && !lines[i + 1]?.trim().startsWith(')')) {
        errors.push({
          file: filePath,
          line: i + 1,
          column: line.length,
          type: 'incomplete_function_call',
          description: 'Incomplete function call',
          suggestion: 'Complete the function call with arguments and closing parenthesis',
          severity: 'critical';
        });
      }
    }

    return { errors, changes };
  }

  /**
   * Check for string literal errors
   */
  private checkStringLiterals(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check for unmatched quotes
      let singleQuotes = 0;
      let doubleQuotes = 0;
      let backticks = 0;
      let inString = false;
      let stringChar = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const prevChar = j > 0 ? line[j - 1] : '';

        if ((char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
            if (char === "'") singleQuotes++;
            else if (char === '"') doubleQuotes++;
            else if (char === '`') backticks++;
          } else if (char === stringChar) {
            inString = false;
          }
        }
      }

      if (inString) {
        errors.push({
          file: filePath,
          line: i + 1,
          column: line.length,
          type: 'unclosed_string',
          description: `Unclosed string literal (${stringChar})`,
          suggestion: `Add closing quote (${stringChar}) at the end of the string`,
          severity: 'critical';
        });
      }
    }

    return { errors, changes };
  }

  /**
   * Check for comma-related errors
   */
  private checkCommaErrors(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for missing commas in object literals and arrays
      if (line.match(/^\s*\w+:\s*[^,;{}]+$/) && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (nextLine.match(/^\s*\w+:/)) {
          errors.push({
            file: filePath,
            line: i + 1,
            column: line.length,
            type: 'missing_comma',
            description: 'Missing comma between object properties',
            suggestion: 'Add comma at the end of this line',
            severity: 'critical';
          });
        }
      }
    }

    return { errors, changes };
  }

  /**
   * Check for object literal specific errors
   */
  private checkObjectLiteralErrors(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];
    let fixedLines = [...lines];
    let hasChanges = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Check for the specific error pattern from the user's error
      // budget_range: '100_500',
      const objectPropertyMatch = trimmedLine.match(/^(\s*)(\w+):\s*['"]([^'"]*?)['"]([^;,\s]*)$/);
      if (objectPropertyMatch && i + 1 < lines.length) {
        const [, indent, property, value, after] = objectPropertyMatch;
        const nextLine = lines[i + 1].trim();

        // If next line is another property or closing brace, we need a comma
        if (nextLine.match(/^\w+:/) || nextLine.match(/^[}\]]/)) {
          if (!after.includes(',') && !after.includes(';')) {
            errors.push({
              file: filePath,
              line: i + 1,
              column: line.length,
              type: 'missing_comma_after_property',
              description: `Missing comma after property '${property}'`,
              suggestion: 'Add comma after the property value',
              severity: 'critical';
            });

            // Auto-fix: Add comma;
            fixedLines[i] = line + ',';
            changes.push(`Added missing comma after property '${property}' at line ${i + 1}`);
            hasChanges = true;
          }
        }
      }
    }

    return {
      errors,
      fixedContent: hasChanges ? fixedLines.join('\n') : undefined,
      changes
    };
  }

  /**
   * Check for JSX-specific errors
   */
  private checkJSXErrors(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for unclosed JSX tags
      const openTags = line.match(/<(\w+)[^>]*>/g) || [];
      const closeTags = line.match(/<\/(\w+)>/g) || [];
      const selfClosing = line.match(/<\w+[^>]*\/>/g) || [];

      if (openTags.length > closeTags.length + selfClosing.length) {
        errors.push({
          file: filePath,
          line: i + 1,
          column: line.length,
          type: 'unclosed_jsx_tag',
          description: 'Unclosed JSX tag',
          suggestion: 'Add closing tag or make the tag self-closing',
          severity: 'critical';
        });
      }
    }

    return { errors, changes };
  }

  /**
   * Check for function declaration errors
   */
  private checkFunctionDeclarationErrors(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for incomplete function declarations
      if (line.match(/^(function|const|let)\s+\w+\s*=?\s*\($/) && !line.includes('=>')) {
        errors.push({
          file: filePath,
          line: i + 1,
          column: line.length,
          type: 'incomplete_function',
          description: 'Incomplete function declaration',
          suggestion: 'Complete the function parameters and body',
          severity: 'critical';
        });
      }
    }

    return { errors, changes };
  }

  /**
   * Check for TypeScript-specific errors
   */
  private checkTypeScriptErrors(lines: string[], filePath: string): { errors: SyntaxError[], fixedContent?: string, changes: string[] } {
    const errors: SyntaxError[] = [];
    const changes: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Check for incomplete type annotations
      if (line.match(/:\s*$/) && !line.includes('?')) {
        errors.push({
          file: filePath,
          line: i + 1,
          column: line.length,
          type: 'incomplete_type_annotation',
          description: 'Incomplete type annotation',
          suggestion: 'Add type after the colon',
          severity: 'critical';
        });
      }

      // Check for incorrect interface syntax
      if (line.startsWith('interface') && !line.includes('{') && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (!nextLine.startsWith('{')) {
          errors.push({
            file: filePath,
            line: i + 1,
            column: line.length,
            type: 'missing_interface_body',
            description: 'Interface declaration missing opening brace',
            suggestion: 'Add opening brace { after interface name',
            severity: 'critical';
          });
        }
      }
    }

    return { errors, changes };
  }

  /**
   * Get all TypeScript/JavaScript files in the project
   */
  private getAllTSFiles(): string[] {
    const files: string[] = [];

    const scanDirectory = (dir: string) => {;
      try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
          const fullPath = path.join(dir, item);

          // Skip excluded patterns
          if (this.excludePatterns.some(pattern => fullPath.includes(pattern))) {
            continue;
          }

          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(item)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.warn(`Cannot read directory ${dir}:`, error.message);
      }
    };

    scanDirectory(this.projectRoot);
    return files;
  }

  /**
   * Generate a comprehensive report
   */
  generateReport(results: FixResult[]): string {;
    const totalFiles = results.length;
    const fixedFiles = results.filter(r => r.fixed).length;
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
    const totalFixes = results.reduce((sum, r) => sum + r.changes.length, 0);

    let report = `🤖 Syntax Error Bot Report\n`;
    report += `═══════════════════════════════\n`;
    report += `📊 Summary:\n`;
    report += `  • Files scanned: ${totalFiles}\n`;
    report += `  • Files fixed: ${fixedFiles}\n`;
    report += `  • Errors found: ${totalErrors}\n`;
    report += `  • Fixes applied: ${totalFixes}\n\n`;

    if (totalErrors === 0) {
      report += `✅ No syntax errors found! Your code is clean.\n`;
    } else {
      report += `📋 Detailed Results:\n`;
      report += `─────────────────────\n`;

      results.forEach(result => {
        if (result.errors.length > 0 || result.changes.length > 0) {
          const fileName = path.basename(result.file);
          report += `📄 ${fileName}\n`;

          if (result.changes.length > 0) {
            report += `  ✅ Fixes applied:\n`;
            result.changes.forEach(change => {
              report += `    • ${change}\n`;
            });
          }

          if (result.errors.length > 0) {
            report += `  ⚠️  Remaining issues:\n`;
            result.errors.forEach(error => {
              const severity = error.severity === 'critical' ? '🔴' :
                             error.severity === 'warning' ? '🟡' : '🔵';
              report += `    ${severity} Line ${error.line}: ${error.description}\n`;
              report += `       💡 ${error.suggestion}\n`;
            });
          }
          report += `\n`;
        }
      });
    }

    report += `\n🎯 Next Steps:\n`;
    if (fixedFiles > 0) {
      report += `  • Review the automatically applied fixes\n`;
      report += `  • Test your application to ensure fixes work correctly\n`;
    }
    if (totalErrors > totalFixes) {
      report += `  • Manually review and fix remaining issues\n`;
      report += `  • Re-run the bot after manual fixes\n`;
    }
    if (totalErrors === 0 || totalErrors === totalFixes) {
      report += `  • Your code should now compile successfully! 🎉\n`;
    }

    return report;
  }
}

// Export for use in other files
export const createSyntaxErrorBot = (projectRoot: string) => new SyntaxErrorBot(projectRoot);
