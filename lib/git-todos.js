/**
 * git-todos
 *
 * 用来在 git 项目下快速添加待办事项
 *
 */

'use strict';

var os = require('os'),
  moment = require('moment'),
  fs = require('fs'),
  util = require('util'),
  path = require('path');


/**
 * 从当前目录开始向上递归查找 git 的根目录
 */
function getGitRootDir(dir) {
  dir = dir || process.cwd();
  var maybeGitFolder = path.join(dir, '.git');
  if (fs.existsSync(maybeGitFolder)) {
    return path.dirname(maybeGitFolder);
  } else {
    return dir === '/' ? false : getGitRootDir(path.dirname(dir));
  }
}

/**
 * 解析 todoFile ，分析出里面的所有待办事项
 * @param file
 */
function parseTodoFile(file) {
  var todo = [], content;
  if (fs.existsSync(file)) {
    content = fs.readFileSync(file).toString();
    return content.split(/[\r\n]+/)
      .map(function(row) { return Todo.parseLine(row); })
      .filter(function(todo) { return !!todo; });
  }
  return todo;
}

/**
 * 将 待办事项保存到文件中
 * @param todos
 * @param file
 */
function saveTodosToFile(todos, file, banner) {
  return fs.writeFileSync(file, todos.reduce(function(sum, todo) {
    return sum + '* ' + todo.toLine();
  }, banner || ''));
}

function Todo(thing, opts) {
  opts = opts || {};
  this.thing = thing.replace(/[\r\n]/g, ' '); // 需要去掉所有换行符
  this.createTime = opts.createTime || moment();
  this.finishTime = opts.finishTime || '';
  this.timeFormat = 'YYYY-MM-DD HH:mm';
}

/**
 * 格式 createTime finishTime thing
 *
 * @param line
 */
Todo.parseLine = function(line) {
  var sep = '\t',
    parts = line.substr(2).trim().split(sep),
    createTime, finishTime, thing;

  if (parts.length < 3) {
    return false;
  }
  createTime = moment(parts.shift());
  if (!createTime.isValid()) {
    return false;
  }

  finishTime = parts.shift();
  if (finishTime.trim() === '') {
    finishTime = '';
  } else {
    finishTime = moment(finishTime);
    if (!finishTime.isValid()) {
      return false;
    }
  }
  thing = parts.join(sep);

  return new Todo(thing, {
    createTime: createTime,
    finishTime: finishTime
  });
};
Todo.prototype = {
  finished: function() {
    return this.finishTime !== '';
  },
  setFinished: function() { this.finishTime = moment(); },
  toLine: function(timeFormat) {
    timeFormat = timeFormat || this.timeFormat;
    return util.format('%s\t%s\t%s' + os.EOL,
      this.createTime.format(timeFormat),
      this.finished() ? this.finishTime.format(timeFormat) : this.finishTime,
      this.thing
    );
  }
};


function TodoCtrl() {
  this.rootDir = getGitRootDir();
  this.unfinishedTodos = null;
  this.archivedTodos = null;

  if (!this.rootDir) { throw new Error('当前不在Git项目下！'); }
  this.unfinishedFile = path.join(this.rootDir, 'TODO.md');
  this.archivedFile = path.join(this.rootDir, 'ARCHIVE.md');
}


TodoCtrl.prototype = {

  /**
   * 添加一条待办事项
   * @param thing
   */
  addTodo: function(thing) {
    var todo = new Todo(thing);
    var todos = this._getUnfinishedTodos();
    todos.push(todo);
    this._save('unfinished');
    return todo;
  },

  _getArchivedTodos: function() {
    if (!this.archivedTodos) {
      this.archivedTodos = parseTodoFile(this.archivedFile);
    }
    return this.archivedTodos;
  },

  _getUnfinishedTodos: function() {
    if (!this.unfinishedTodos) {
      this.unfinishedTodos = parseTodoFile(this.unfinishedFile);
    }
    return this.unfinishedTodos;
  },

  // all, archived, unfinished
  _save: function(type) {
    if (type === 'all' || type === 'archived') {
      saveTodosToFile(this.archivedTodos, this.archivedFile, '## Archived' + os.EOL);
    }
    if (type === 'all' || type === 'unfinished') {
      saveTodosToFile(this.unfinishedTodos, this.unfinishedFile, '## Unfinished' + os.EOL);
    }
    return true;
  },

  /**
   * 将指定的todo项标记为已完成
   * @param index
   */
  archiveTodo: function(index) {
    index = parseInt(index, 10);
    var todos = this._getUnfinishedTodos();
    if (index < 0 || todos.length <= index) {
      throw new Error('Not find todo');
    }
    var archives = this._getArchivedTodos(),
      todo = todos.splice(index, 1).pop();
    todo.setFinished();
    archives.push(todo);
    this._save('all');
    return todo;
  },

  /**
   * 获取过滤条件下的所有未完成的待办事项
   * @param filters
   */
  getFilteredTypeTodos: function(type, filters) {
    filters = filters || {};
    var todos = type === 'archived' ? this._getArchivedTodos() : this._getUnfinishedTodos();
    todos.forEach(function(todo, index) {
      todo.index = index;
    });
    return todos.filter(function(todo) {
      if (filters.before && todo.createTime.unix() > filters.before.unix()) {
        return false;
      }
      if (filters.after && todo.createTime.unix() < filters.after.unix()) {
        return false;
      }
      return true;
    });
  },

  /**
   * 获取过滤条件下的所有待办事项（包括完成的和未完成的）
   * @param filters
   */
  getFilteredAllTodos: function(filters) {
    return this.getFilteredTypeTodos('unfinished', filters)
      .concat(this.getFilteredTypeTodos('archived', filters));
  }
};


module.exports = TodoCtrl;

