const co = require('coroutine');
const { BufferedStream } = require('io');

const BUF = Symbol('LogStream#BUF');
const LOCK = Symbol('LogStream#LOCK');
const TAG = Symbol('LogStream#TAG');
const EVENT = Symbol('LogStream#EVENT');
const BUF_LENGTH = Symbol('LogStream#BUF_LENGTH');
const FLUSH_TIMER = Symbol('LogStream#FLUSH_TIMER');
const TO_WRITE = Symbol('LogStream#TO_WRITE');
const TASK_TAG = Symbol('LogStream#TASK_TAG');
const WRITE_TASK = Symbol('LogStream#WRITE_TASK');
const FLUSH = Symbol('LogStream#FLUSH');
const _FLUSH = Symbol('LogStream#_FLUSH');

class LogStream extends BufferedStream {
  constructor(...argv) {
    super(...argv);

    this[BUF] = new Buffer();
    this[LOCK] = new co.Lock();
    this[TAG] = 0;
    this[EVENT] = new co.Event();
    this[BUF_LENGTH] = this[BUF].length;
    this[FLUSH_TIMER] = setInterval(this[FLUSH].bind(this), 500);
    this.MAX_SIZE = 50000000;
    this[TO_WRITE] = new co.BlockQueue(50000);
    this[TASK_TAG] = true;
    this[WRITE_TASK] = co.start(() => {
      let log;
      while (log = this[TO_WRITE].take()) {
        if (!this[TASK_TAG] && !Buffer.isBuffer(log)) {
          break;
        }
        this.write(log);
      }
      this[EVENT].set();
    });
  }

  writeText(str) {
    if (this[BUF].length > this.MAX_SIZE) {
      this[_FLUSH]();
    }
    this[BUF].append(str);
  }

  writeLine(str) {
    this.writeText(str + '\n');
  }

  [FLUSH]() {
    if (this[BUF].length > 0) {
      if (this[TAG] >= 3) {
        this[_FLUSH]();
        return;
      }

      if (this[BUF_LENGTH] < this[BUF].length) {
        this[BUF_LENGTH] = this[BUF].length;
        this[TAG]++;
        return;
      }

      this[_FLUSH]();
    }
  }

  [_FLUSH]() {
    try {
      this[LOCK].acquire();
      if (this[BUF].length > 0) {
        const buf = this[BUF];
        if (buf && buf.length && buf.length > 0) {
          this[TO_WRITE].put(buf);
        }
        this[BUF] = new Buffer();
        this[BUF_LENGTH] = this[BUF].length;
        this[TAG] = 0;
      }
    } catch (e) {

    } finally {
      this[LOCK].release();
    }
  }

  end() {
    clearInterval(this[FLUSH_TIMER]);
    this[_FLUSH]();
    this[TASK_TAG] = false;
    this[TO_WRITE].put(0);
    this[EVENT].wait();
    this.close();
    this.stream.close();
  }
};

module.exports = LogStream;
