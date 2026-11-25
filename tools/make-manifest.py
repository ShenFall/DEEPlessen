#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
深时 · 重建资料清单（服务器版，只需 Python 3）

用法：
    python3 make-manifest.py /www/wwwroot/deep

作用：扫描 <根>/files 下的分组与文件，重新生成 manifest.json。
门户只读 manifest.json，所以增删资料后跑一次即可，不用重传其他文件。
"""

import json
import os
import sys
from datetime import datetime, timezone

SKIP = {'Thumbs.db', 'desktop.ini', '.DS_Store'}


def e(s: str) -> str:
    """按 URL 规则编码（保留 / 语义由调用方处理）"""
    from urllib.parse import quote
    return quote(s, safe='')


def main() -> int:
    if len(sys.argv) < 2:
        print('用法：python3 make-manifest.py <门户根目录>')
        return 1

    root = sys.argv[1]
    files_dir = os.path.join(root, 'files')
    if not os.path.isdir(files_dir):
        print('找不到 %s' % files_dir)
        return 1

    courses = []
    for group in sorted(os.listdir(files_dir)):
        gdir = os.path.join(files_dir, group)
        if not os.path.isdir(gdir) or group.startswith('.'):
            continue
        items = []
        for name in sorted(os.listdir(gdir)):
            full = os.path.join(gdir, name)
            if not os.path.isfile(full) or name in SKIP:
                continue
            items.append({
                'name': name,
                'size': os.path.getsize(full),
                'url': 'files/%s/%s' % (e(group), e(name)),
            })
        if items:
            courses.append({'name': group, 'items': items})

    manifest = {
        'generatedAt': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'),
        'courses': courses,
    }

    out = os.path.join(root, 'manifest.json')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    total = sum(len(c['items']) for c in courses)
    size = sum(i['size'] for c in courses for i in c['items'])
    print('已重建 manifest.json：%d 个分组 / %d 个文件 / %.1f MB'
          % (len(courses), total, size / 1048576))
    for c in courses:
        print('  %s  %d' % (c['name'], len(c['items'])))
    return 0


if __name__ == '__main__':
    sys.exit(main())
