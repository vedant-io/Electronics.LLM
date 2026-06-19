import os

def resolve_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    in_head = False
    in_incoming = False

    changed = False
    for line in lines:
        if line.startswith('<<<<<<< HEAD'):
            in_head = True
            changed = True
        elif line.startswith('======='):
            in_head = False
            in_incoming = True
        elif line.startswith('>>>>>>>'):
            in_incoming = False
        else:
            if in_head:
                new_lines.append(line)
            elif not in_incoming:
                new_lines.append(line)

    if changed:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print(f"Resolved {file_path}")

for root, _, files in os.walk('.'):
    # Skip node_modules and .next
    if 'node_modules' in root or '.git' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith(('.ts', '.tsx', '.json', '.js', '.jsx')):
            try:
                resolve_file(os.path.join(root, file))
            except Exception as e:
                pass
