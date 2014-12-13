#! /usr/bin/env node

'use strict';

var gitTodos = require('./git-todos'),
  program = require('commander');


var ctrl = new gitTodos();

program
  .version(require('../package.json').version)
  .option('-a, --all', '显示当前项目下的所有待办事项')
  .option('-f, --finished', '显示当前项目下的所有已经完成的待办事项')

  // sort
  //.option('-s, --sort <keyword>', '对返回结果进行排序，keyword可以是：createTime,finishTime,name')
  //.option('-r, --reverse', '对返回结果倒排列')

  // filters
  .option('-A, --after <datetime>', '显示某日期之后的待办事项')
  .option('-B, --before <datetime>', '显示某日期之前的待办事项');


program
  .command('add <thing>')
  .description('添加待办事项')
  .action(function(thing) {
    thing = thing.trim();
    if (thing) {
      var todo = ctrl.addTodo(thing);
      console.log('Added: ' + todo.toLine());
    } else {
      console.error('Nothing to add');
    }
    process.exit();
  });


program
  .command('archive <number>')
  .description('归档指定的待办事项')
  .action(function(index) {
    if (/^\d+$/.test(index)) {
      var todo = ctrl.archiveTodo(index);
      console.log('Archived: ' + todo.toLine());
    } else {
      console.error('要归档的待办事项的索引不是一个数字');
    }
    process.exit();
  });


program
  .parse(process.argv);



var filters = {}, list;

['after', 'before'].forEach(function(key) {
  if (program[key]) {
    var time = moment(program[key]);
    if (time.isValid()) {
      filters[key] = time;
    } else {
      console.error('Invalid time format');
      process.exit();
    }
  }
});


if (program.all) {
  list = ctrl.getFilteredAllTodos(filters);
} else if (program.finished) {
  list = ctrl.getFilteredTypeTodos('archived', filters);
} else {
  list = ctrl.getFilteredTypeTodos('unfinished', filters);
}


if (list.length === 0) {
  console.log('Empty todos');
} else {
  list.forEach(function(todo) {
    var index = '#' + (todo.finished() ? '#' : todo.index) + '\t';
    console.log(index + todo.toLine().trim());
  });
}

