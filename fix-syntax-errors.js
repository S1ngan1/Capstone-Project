// Quick syntax fixer for git commit issues
const fs = require('fs');
const path = require('path');

function fixTypeScriptFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remove any stray characters that might cause parsing issues
    const originalContent = content;

    // Fix common issues that might prevent git commit
    content = content.replace(/\r\n/g, '\n'); // Normalize line endings
    content = content.replace(/\t/g, '  '); // Replace tabs with spaces
    content = content.replace(/\s+$/gm, ''); // Remove trailing whitespace

    // Ensure files end with a newline
    if (!content.endsWith('\n')) {
      content += '\n';
      modified = true;
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
  }
  return false;
}

function findAndFixFiles(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      fixedCount += findAndFixFiles(fullPath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      if (fixTypeScriptFile(fullPath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

console.log('🔧 Fixing syntax issues for git commit...');
const fixedCount = findAndFixFiles(__dirname);
console.log(`✨ Fixed ${fixedCount} files`);
console.log('✅ Ready for git commit!');
