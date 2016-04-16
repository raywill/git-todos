# git-todos

> 在git项目下快速创建待办事项


## Getting Started


```sh
npm -g install https://github.com/raywill/git-todos
git todos -h
```

## 功能

在当前 git 项目的根目录下生成 TODO.md 和 ARCHIVE.md 存储待完成和已完成项目。

```
bash-3.2$ git-todos --help

  Usage: git-todos [options] [command]

  Commands:

    add <thing>       添加待办事项
    archive <number>  归档指定的待办事项

  Options:

    -h, --help               output usage information
    -V, --version            output the version number
    -a, --all                显示当前项目下的所有待办事项
    -f, --finished           显示当前项目下的所有已经完成的待办事项
    -A, --after <datetime>   显示某日期之后的待办事项
    -B, --before <datetime>  显示某日期之前的待办事项
```

## 常见问题

输入git todos 找不到 todos 命令，显示：
```
bash-3.2$ git todos
git: 'todos' is not a git command. See 'git --help'.
```
解决方法：
-  确认 npm 安装命令使用了 -g 选项
- 执行 <code>link /usr/local/lib/node_modules/git-todos/lib/cli.js /usr/local/bin/git-todos</code>

## License

Copyright (c) 2014 Zhonglei Qiu  
Licensed under the MIT license.
