const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') {
        if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
          filelist.push(dirFile);
        }
      }
    }
  });
  return filelist;
};

const files = [...walkSync('app'), ...walkSync('components')];

let totalChanges = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  content = content.replace(/rounded-\[2rem\]/g, 'rounded-xl');
  content = content.replace(/rounded-3xl/g, 'rounded-xl');
  content = content.replace(/rounded-2xl/g, 'rounded-lg');
  content = content.replace(/rounded-xl/g, 'rounded-md');
  // Also fix some specific rounded-full that might be too pill-like for buttons
  // like px-8 py-4 rounded-full -> rounded-md
  content = content.replace(/rounded-full/g, (match, offset, string) => {
    // If it's near 'px-' and 'py-', it's likely a button
    const context = string.substring(Math.max(0, offset - 30), Math.min(string.length, offset + 30));
    if (context.includes('px-') && context.includes('py-') && !context.includes('size-') && !context.includes('w-') && !context.includes('h-')) {
      return 'rounded-md';
    }
    return match;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated', file);
    totalChanges++;
  }
});

console.log('Total files updated:', totalChanges);
