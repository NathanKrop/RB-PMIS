const fs = require('fs');
const path = require('path');
const MIG_DIR = path.join(__dirname, '..', 'migrations');

function processFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/);
  let out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trigMatch = line.match(/^\s*CREATE\s+TRIGGER\s+(\w+)/i);
    if (trigMatch) {
      // find ON <table> in current or next few lines
      let remaining = line;
      let j = i;
      while (!/\bON\s+[\w\.]+/i.test(remaining) && j + 1 < lines.length && j < i + 5) {
        j++;
        remaining += ' ' + lines[j];
      }
      const onMatch = remaining.match(/\bON\s+([\w\.]+)/i);
      const table = onMatch ? onMatch[1] : 'public.unknown_table';
      const name = trigMatch[1];
      out.push(`DROP TRIGGER IF EXISTS ${name} ON ${table};`);
      out.push(line);
      continue;
    }
    const polMatch = line.match(/^\s*CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([\w\.]+)/i);
    if (polMatch) {
      const name = polMatch[1];
      const table = polMatch[2];
      out.push(`DROP POLICY IF EXISTS "${name}" ON ${table};`);
      out.push(line);
      continue;
    }
    out.push(line);
  }
  const newText = out.join('\n');
  if (newText !== text) {
    fs.writeFileSync(filePath + '.bak', text, 'utf8');
    fs.writeFileSync(filePath, newText, 'utf8');
    console.log(`Updated ${path.basename(filePath)}`);
  } else {
    console.log(`No changes for ${path.basename(filePath)}`);
  }
}

const files = fs.readdirSync(MIG_DIR).filter(f => f.endsWith('.sql'));
for (const f of files) {
  processFile(path.join(MIG_DIR, f));
}
