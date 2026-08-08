const fs = require('fs');

const files = process.argv.slice(2);

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  
  let content = fs.readFileSync(file, 'utf8');
  
  // This reverse mapping is a best-effort heuristic since the previous mapping was lossy
  // rounded-xl (which was 3xl or [2rem]) -> rounded-3xl
  // rounded-lg (which was 2xl) -> rounded-2xl
  // rounded-md (which was xl or full) -> rounded-xl  (for buttons/small elements)
  
  content = content.replace(/rounded-xl/g, 'rounded-3xl');
  content = content.replace(/rounded-lg/g, 'rounded-2xl');
  content = content.replace(/rounded-md/g, 'rounded-xl');
  
  // We'll leave app/(marketing)/page.tsx out of this file list entirely,
  // so it retains the tighter borders!

  fs.writeFileSync(file, content);
  console.log('Reversed', file);
});
