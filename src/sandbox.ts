var util = require("util");
var vm = require("vm");

export function createSandbox(node, RED) {

    var functionText = "var results = null;" +
        "results = (function(msg,__send__,__done__){ " +
        "var __msgid__ = msg._msgid;" +
        "var node = {" +
        "id:__node__.id," +
        "name:__node__.name," +
        "log:__node__.log," +
        "error:__node__.error," +
        "warn:__node__.warn," +
        "debug:__node__.debug," +
        "trace:__node__.trace," +
        "on:__node__.on," +
        "status:__node__.status," +
        "send:function(msgs,cloneMsg){ __node__.send(__send__,__msgid__,msgs,cloneMsg);}," +
        "done:__done__" +
        "};\n" +
        node.func + "\n" +
        "})(msg,send,done);";



    var sandbox = {
        console: console,
        util: util,
        Buffer: Buffer,
        Date: Date,
        RED: {
            util: RED.util
        },
        __node__: {
            id: node.id,
            name: node.name,
            log: function () {
                node.log.apply(node, arguments);
            },
            error: function () {
                node.error.apply(node, arguments);
            },
            warn: function () {
                node.warn.apply(node, arguments);
            },
            debug: function () {
                node.debug.apply(node, arguments);
            },
            trace: function () {
                node.trace.apply(node, arguments);
            },
            send: function (send, id, msgs, cloneMsg) {
                sendResults(node, send, id, msgs, cloneMsg, RED);
            },
            on: function () {
                if (arguments[0] === "input") {
                    //@ts-ignore
                    throw new Error(RED._("function.error.inputListener"));
                }
                node.on.apply(node, arguments);
            },
            status: function () {
                node.status.apply(node, arguments);
            }
        },
        context: {
            set: function () {
                node.context().set.apply(node, arguments);
            },
            get: function () {
                return node.context().get.apply(node, arguments);
            },
            keys: function () {
                return node.context().keys.apply(node, arguments);
            },
            get global() {
                return node.context().global;
            },
            get flow() {
                return node.context().flow;
            }
        },
        flow: {
            set: function () {
                node.context().flow.set.apply(node, arguments);
            },
            get: function () {
                return node.context().flow.get.apply(node, arguments);
            },
            keys: function () {
                return node.context().flow.keys.apply(node, arguments);
            }
        },
        global: {
            set: function () {
                node.context().global.set.apply(node, arguments);
            },
            get: function () {
                return node.context().global.get.apply(node, arguments);
            },
            keys: function () {
                return node.context().global.keys.apply(node, arguments);
            }
        },
        env: {
            get: function (envVar) {
                var flow = node._flow;
                return flow.getSetting(envVar);
            }
        },
        setTimeout: function () {
            var func = arguments[0];
            var timerId;
            arguments[0] = function () {
                sandbox.clearTimeout(timerId);
                try {
                    func.apply(this, arguments);
                } catch (err) {
                    node.error(err, {});
                }
            };
            timerId = setTimeout.apply(this, arguments);
            node.outstandingTimers.push(timerId);
            return timerId;
        },
        clearTimeout: function (id) {
            clearTimeout(id);
            var index = node.outstandingTimers.indexOf(id);
            if (index > -1) {
                node.outstandingTimers.splice(index, 1);
            }
        },
        setInterval: function () {
            var func = arguments[0];
            var timerId;
            arguments[0] = function () {
                try {
                    func.apply(this, arguments);
                } catch (err) {
                    node.error(err, {});
                }
            };
            timerId = setInterval.apply(this, arguments);
            node.outstandingIntervals.push(timerId);
            return timerId;
        },
        clearInterval: function (id) {
            clearInterval(id);
            var index = node.outstandingIntervals.indexOf(id);
            if (index > -1) {
                node.outstandingIntervals.splice(index, 1);
            }
        }
    };

    var context = vm.createContext(sandbox);

    node.script = vm.createScript(functionText, {
        filename: 'Function node:' + node.id + (node.name ? ' [' + node.name + ']' : ''), // filename for stack traces
        displayErrors: true
        // Using the following options causes node 4/6 to not include the line number
        // in the stack output. So don't use them.
        // lineOffset: -11, // line number offset to be used for stack traces
        // columnOffset: 0, // column number offset to be used for stack traces
    });

    return context;
}

export function sendResults(node, send, _msgid, msgs, cloneFirstMessage, RED) {
    if (msgs == null) {
        return;
    } else if (!util.isArray(msgs)) {
        msgs = [msgs];
    }
    var msgCount = 0;
    for (var m = 0; m < msgs.length; m++) {
        if (msgs[m]) {
            if (!util.isArray(msgs[m])) {
                msgs[m] = [msgs[m]];
            }
            for (var n = 0; n < msgs[m].length; n++) {
                var msg = msgs[m][n];
                if (msg !== null && msg !== undefined) {
                    if (typeof msg === 'object' && !Buffer.isBuffer(msg) && !util.isArray(msg)) {
                        if (msgCount === 0 && cloneFirstMessage !== false) {
                            msgs[m][n] = RED.util.cloneMessage(msgs[m][n]);
                            msg = msgs[m][n];
                        }
                        msg._msgid = _msgid;
                        msgCount++;
                    } else {
                        var type = typeof msg;
                        if (type === 'object') {
                            // @ts-ignore
                            type = Buffer.isBuffer(msg) ? 'Buffer' : (util.isArray(msg) ? 'Array' : 'Date');
                        }
                        // @ts-ignore
                        node.error(RED._("function.error.non-message-returned", { type: type }));
                    }
                }
            }
        }
    }
    if (msgCount > 0) {
        send(msgs);
    }
}