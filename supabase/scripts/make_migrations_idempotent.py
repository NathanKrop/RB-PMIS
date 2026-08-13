import re
from pathlib import Path

MIG_DIR = Path('d:/Projects/RB-PMIS/supabase/migrations')

trigger_re = re.compile(r'CREATE\s+TRIGGER\s+(\w+)\b(.*?ON\s+([\w\.]+))', re.IGNORECASE)
policy_re = re.compile(r'CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([\w\.]+)', re.IGNORECASE)

for path in MIG_DIR.glob('*.sql'):
    text = path.read_text(encoding='utf-8')
    orig = text
    # Process triggers: insert DROP before each CREATE TRIGGER
    def trigger_repl(m):
        name = m.group(1)
        on_clause = m.group(2)
        table = m.group(3)
        drop = f"DROP TRIGGER IF EXISTS {name} ON {table};\n"
        return drop + 'CREATE TRIGGER ' + name + on_clause[on_clause.upper().find('ON'):]

    # But safer to insert DROP line before the CREATE TRIGGER line
    lines = text.splitlines()
    out_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r'\s*CREATE\s+TRIGGER\s+(\w+)', line, re.IGNORECASE)
        if m:
            # attempt to find table in the same line or following lines
            remaining = line
            j = i
            while ' ON ' not in remaining.upper() and j+1 < len(lines):
                j += 1
                remaining += ' ' + lines[j]
            on_match = re.search(r'ON\s+([\w\.]+)', remaining, re.IGNORECASE)
            table = on_match.group(1) if on_match else 'public.unknown_table'
            name = m.group(1)
            out_lines.append(f"DROP TRIGGER IF EXISTS {name} ON {table};")
            out_lines.append(line)
            i += 1
            continue
        out_lines.append(line)
        i += 1
    text = '\n'.join(out_lines)

    # Process policies: insert DROP POLICY before CREATE POLICY
    lines = text.splitlines()
    out_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        m = re.match(r'\s*CREATE\s+POLICY\s+"([^"]+)"\s+ON\s+([\w\.]+)', line, re.IGNORECASE)
        if m:
            name = m.group(1)
            table = m.group(2)
            out_lines.append(f"DROP POLICY IF EXISTS \"{name}\" ON {table};")
            out_lines.append(line)
            i += 1
            continue
        out_lines.append(line)
        i += 1
    new_text = '\n'.join(out_lines)

    if new_text != orig:
        backup = path.with_suffix(path.suffix + '.bak')
        path.write_text(new_text, encoding='utf-8')
        backup.write_text(orig, encoding='utf-8')
        print(f"Updated {path.name}, backup saved to {backup.name}")
    else:
        print(f"No changes for {path.name}")
