const test = require('test');
const fs = require('fs');
const co = require('coroutine');
const path = require('path');
const assert = require('assert');
const mkdirp = require('@fibjs/mkdirp');
const rmdirr = require('@fibjs/rmdirr');

test.setup();

const LogStream = require('../');

describe("LogStream", () => {
  const tmpDir = path.join(__dirname, 'tmp');
  const tmpFile = path.join(tmpDir, 'test');

  beforeEach(() => {
    mkdirp(tmpDir);
  });

  after(() => {
    rmdirr(tmpDir);
  });

  it('should new works ok', () => {
    const fd = fs.open(tmpFile, 'w');
    const bf = new LogStream(fd);
    bf.end();
  });

  it('should writeText works ok', () => {
    const fd = fs.open(tmpFile, 'w');
    const bf = new LogStream(fd);
    const str = `test ${Date.now()}`;
    bf.writeText(str);
    bf.end();
    const str1 = fs.readFile(tmpFile).toString();
    assert(str === str1);
  });

  it('should writeText mutil times works ok', () => {
    const fd = fs.open(tmpFile, 'w');
    const bf = new LogStream(fd);
    const str = `test ${Date.now()}`;
    bf.writeText(str);
    bf.writeText(str);
    bf.writeText(str);
    bf.end();
    const str1 = fs.readFile(tmpFile).toString();
    assert(str + str + str === str1);
  });

  it('should writeLine works ok', () => {
    const fd = fs.open(tmpFile, 'w');
    const bf = new LogStream(fd);
    const str = `test ${Date.now()}`;
    bf.writeLine(str);
    bf.end();
    const str1 = fs.readFile(tmpFile).toString();
    assert(str + '\n' === str1);
  });

  it('should writeLine mutil times works ok', () => {
    const fd = fs.open(tmpFile, 'w');
    const bf = new LogStream(fd);
    const str = `test ${Date.now()}`;
    bf.writeLine(str);
    bf.writeLine(str);
    bf.writeLine(str);
    bf.end();
    const str1 = fs.readFile(tmpFile).toString();
    assert(str + '\n' + str + '\n' + str + '\n' === str1);
  });

  it('should write background ok', () => {
    const fd = fs.open(tmpFile, 'w');
    const bf = new LogStream(fd);
    const str = `test ${Date.now()}`;
    bf.writeText(str);
    assert.notOk(fs.readFile(tmpFile));
    bf.end();
    const str1 = fs.readFile(tmpFile).toString();
    assert(str === str1);
  });

  it('should write background success', () => {
    const fd = fs.open(tmpFile, 'w');
    const bf = new LogStream(fd);
    const str = `test ${Date.now()}`;
    bf.writeText(str);
    assert.notOk(fs.readFile(tmpFile));
    co.sleep(1600);
    let str1 = fs.readFile(tmpFile).toString();
    assert(str === str1);
    bf.end();
    str1 = fs.readFile(tmpFile).toString();
    assert(str === str1);
  });
});

process.exit(test.run(console.DEBUG));
