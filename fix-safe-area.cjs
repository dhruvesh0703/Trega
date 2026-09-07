const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
let changed = 0;
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('className="fixed inset-0')) {
    // Only replace if not already padded
    if (!content.includes('pt-[env(safe-area-inset-top)]')) {
       content = content.replace(/className="fixed inset-0/g, 'className="fixed inset-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]');
       fs.writeFileSync(file, content);
       changed++;
    }
  }
});
console.log(`Updated ${changed} files.`);
