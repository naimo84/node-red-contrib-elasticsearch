
import { Red } from 'node-red';
import { createSandbox, sendResults } from './sandbox';
const handlebars = require('handlebars');
module.exports = function (RED: Red) {

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
        node.funccompiled = handlebars.compile(node.func);
        let context = createSandbox(node, RED);

        node.on('input', async (msg, send, done) => {
            await search(node, msg)
            context.msg = msg;
            context.send = send;
            context.done = done;
            let results = node.funccompiled({msg:msg})
            console.log(results);
            
            node.script.runInContext(context);
            sendResults(this, send, msg._msgid, context.results, false, RED);
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