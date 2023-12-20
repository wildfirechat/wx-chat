#!/bin/bash
#
# 将wfc 目录下的所有 js 文件，压缩并输出到 wfc.min目录

# 使用 find 命令遍历 wfc 目录下的所有 .js 文件
find wfc -name "*.js" -type f | while read file; do
  # 提取文件名
  filename=$(basename "$file")
  # 构建目标文件路径
  target_file="wfc.min/${file#wfc/}"
  # 创建目标文件所在的目录
  mkdir -p "$(dirname "$target_file")"
  # 执行 terser 压缩和混淆操作，并将结果重定向到 wfc.min 目录下的相同文件名文件里面
  terser --compress --mangle -- "$file" > "$target_file"
done
