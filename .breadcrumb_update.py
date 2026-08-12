from pathlib import Path
import re

files = [
    'src/app/dashboard/department/beneficiaries/page.tsx',
    'src/app/dashboard/department/evidence/page.tsx',
    'src/app/dashboard/department/knowledge/page.tsx',
    'src/app/dashboard/department/notifications/page.tsx',
    'src/app/dashboard/department/resources/page.tsx',
    'src/app/dashboard/department/reviews/page.tsx',
    'src/app/dashboard/management/activities/page.tsx',
    'src/app/dashboard/management/beneficiaries/page.tsx',
    'src/app/dashboard/management/data-quality/page.tsx',
    'src/app/dashboard/management/knowledge/page.tsx',
    'src/app/dashboard/management/objectives/page.tsx',
    'src/app/dashboard/management/resources/page.tsx',
    'src/app/dashboard/management/reports/page.tsx',
    'src/app/dashboard/management/risks/page.tsx',
    'src/app/dashboard/officer/reports/page.tsx',
    'src/app/dashboard/officer/beneficiaries/page.tsx',
    'src/app/dashboard/officer/data-quality/page.tsx',
    'src/app/dashboard/officer/deadlines/page.tsx',
    'src/app/dashboard/officer/departments/page.tsx',
    'src/app/dashboard/officer/evidence/page.tsx',
    'src/app/dashboard/officer/framework/page.tsx',
    'src/app/dashboard/officer/knowledge/page.tsx',
    'src/app/dashboard/officer/notifications/page.tsx',
    'src/app/dashboard/officer/resources/page.tsx',
    'src/app/dashboard/officer/risks/page.tsx',
]

import_line = 'import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb";\n'

for file_path in files:
    path = Path(file_path)
    if not path.exists():
        print(f'SKIP missing {file_path}')
        continue
    text = path.read_text(encoding='utf-8')
    if 'Breadcrumb compact' in text:
        print(f'SKIP already updated {file_path}')
        continue
    if import_line not in text:
        imports = list(re.finditer(r'^import .*\n', text, flags=re.M))
        if imports:
            last_import = imports[-1]
            insert_pos = last_import.end()
            text = text[:insert_pos] + import_line + text[insert_pos:]
        else:
            text = import_line + text
    match = re.search(r'<h1 className="text-2xl font-semibold">([^<]+)<\/h1>', text)
    if not match:
        print(f'NO H1 match for {file_path}')
        continue
    heading = match.group(1).strip()
    replacement = (
        '<Breadcrumb compact className="mb-3">\n'
        f'          <BreadcrumbItem current>{heading}</BreadcrumbItem>\n'
        '        </Breadcrumb>\n'
        f'        {match.group(0)}'
    )
    text = text.replace(match.group(0), replacement, 1)
    path.write_text(text, encoding='utf-8')
    print(f'UPDATED {file_path}')
