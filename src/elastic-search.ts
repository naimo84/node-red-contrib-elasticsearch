
import { Red, Node } from 'node-red';
const { Client } = require('elasticsearch')

module.exports = function (RED: Red) {

    var util = require("util");
    var vm = require("vm");

    function sendResults(node, send, _msgid, msgs, cloneFirstMessage) {
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

    function templateNode(config: any) {
        RED.nodes.createNode(this, config);
        let configNode = RED.nodes.getNode(config.confignode);
        if (!configNode) {
            this.error("Config is missing!")
            return;
        }
        let node = this;



        node.config = configNode;
        node.query = config.query;
        node.index = config.index;
        node.outputalways = config.outputalways;
        node.size = config.size;
        node.timerangeFrom = config.timerangeFrom || 'now-1h';
        node.timerangeTo = config.timerangeTo || 'now';
        node.func = config.func;

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
            this.func + "\n" +
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
                    sendResults(node, send, id, msgs, cloneMsg);
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

        this.script = vm.createScript(functionText, {
            filename: 'Function node:' + this.id + (this.name ? ' [' + this.name + ']' : ''), // filename for stack traces
            displayErrors: true
            // Using the following options causes node 4/6 to not include the line number
            // in the stack output. So don't use them.
            // lineOffset: -11, // line number offset to be used for stack traces
            // columnOffset: 0, // column number offset to be used for stack traces
        });


        node.on('input', async (msg, send, done) => {
           await search(node, msg)
            context.msg = msg;
            context.send = send;
            context.done = done;
            node.script.runInContext(context);
            sendResults(this, send, msg._msgid, context.results, false);
        })
    }


    async function search(node, msg) {
        try {
            let elastic_query = {
                bool: {
                    must: [
                        {
                            range: {
                                "@timestamp": {
                                    gte: node.timerangeFrom,
                                    lte: node.timerangeTo
                                }
                            }
                        }]
                }
            }

            let query = JSON.parse(node.query);
            if (msg.payload.query) {
                query = `*${msg.payload.query}*`;
            }
            if (JSON.stringify(query).includes("wildcard")) {
                elastic_query.bool.must.push(query)
            } else {
                elastic_query.bool.must.push({
                    // @ts-ignore
                    wildcard: query
                })

            }
            let options: any = {
                index: node.index,
                body: {
                    query: elastic_query
                },
                size: msg.payload.size || node.size || 10
            }

            const result = await node.config.client.search(options)
            let hits = [];
            if (result && result.hits) {
                for (let item of result.hits.hits) {
                    hits.push(Object.assign({
                        _id: item._id,
                        index: item._index
                    }, item._source))
                }
            }
            if (node.outputalways || result.hits.total.value > 0)
                msg.payload = {
                    index: node.index,
                    query: node.query,
                    total: result.hits.total.value,
                    items: hits
                }


        } catch (e) {
            console.error(e);
            return {
                total: 0,
                hits: []
            }
        }
    }


    RED.nodes.registerType("elastic-search", templateNode);
}