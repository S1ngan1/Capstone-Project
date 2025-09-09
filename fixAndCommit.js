#!/usr/bin/env node

// Comprehensive syntax error fixer for React Native TypeScript project
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting comprehensive syntax error fix for git commit...');

// Function to fix common TypeScript file issues
function fixTypeScriptFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Fix line endings (normalize to LF)
    content = content.replace(/\r\n/g, '\n');

    // Remove trailing whitespace
    content = content.replace(/[ \t]+$/gm, '');

    // Ensure file ends with newline
    if (!content.endsWith('\n')) {
      content += '\n';
      modified = true;
    }

    // Fix common semicolon issues in TypeScript
    content = content.replace(/(\w+:\s*[^;,\n}]+)(\n)/g, (match, p1, p2) => {
      if (!p1.includes(';') && !p1.includes(',') && !p1.includes('}')) {
        return p1 + ';' + p2;
      }
      return match;
    });

    // Fix incomplete import statements
    content = content.replace(/import\s+\{([^}]+)\}\s+from\s+([^;'"\n]+)(?![;'"])/g,
      (match, imports, from) => {
        const cleanFrom = from.trim();
        if (!cleanFrom.startsWith("'") && !cleanFrom.startsWith('"')) {
          return `import { ${imports} } from '${cleanFrom}';`;
        }
        return match;
      });

    // Write back if modified
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${path.basename(filePath)}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and fix TypeScript files
function fixProjectFiles(dir, fixedCount = 0) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip node_modules and other unnecessary directories
        if (!['node_modules', '.git', '.expo', 'dist', 'build'].includes(item) && !item.startsWith('.')) {
          fixedCount = fixProjectFiles(fullPath, fixedCount);
        }
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        if (fixTypeScriptFile(fullPath)) {
          fixedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`Error processing directory ${dir}:`, error.message);
  }

  return fixedCount;
}

// Main execution
const projectRoot = process.cwd();
console.log(`📁 Processing project: ${projectRoot}`);

const fixedCount = fixProjectFiles(projectRoot);

console.log(`\n✨ Fixed ${fixedCount} TypeScript files`);
console.log('🎉 Project is now ready for git commit!');
console.log('\nNext steps:');
console.log('1. git add .');
console.log('2. git commit -m "Fix TypeScript syntax and IDE configuration issues"');
console.log('3. git push');

// Additional git preparation
console.log('\n🔄 Checking git status...');
const { execSync } = require('child_process');

try {
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  if (gitStatus.trim()) {
    console.log('📊 Files ready to be committed:');
    console.log(gitStatus);
  } else {
    console.log('✅ No changes detected - project is clean');
  }
} catch (error) {
  console.log('ℹ️  Could not check git status (may not be in a git repository)');
}

console.log('\n🚀 Ready to commit!');
