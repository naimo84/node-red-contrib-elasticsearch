
import { Red, Node } from 'node-red';
const { Client } = require('elasticsearch')

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
        node.timerangeFrom = config.timerangeFrom;
        node.timerangeTo = config.timerangeTo;


        node.on('input', async (msg) => {
            search(node, msg)
        })
    }


    async function search(node, msg) {
        try {

            let wildcard = JSON.parse(node.query);
            if (msg.payload.query) {
                wildcard = `*${msg.payload.query}*`;
            }
            let elastic_query = {
                "bool": {
                    "must": [
                        {
                            wildcard: wildcard
                        },
                        {
                            range: {
                                "@timestamp": {
                                    gte: "now-1h",
                                    lte: "now"
                                }
                            }
                        }]
                }
            }

            let options = {
                index: node.index,
                body: {
                    query: elastic_query
                }
            }

            const result = await node.config.client.search(options)
            let hits = [];
            if (result && result.hits) {
                for (let item of result.hits.hits) {
                    hits.push(Object.assign({
                        _id: item._id
                    }, item._source))
                }
            }

            node.send({
                payload: {
                    total: result.hits.total.value,
                    items: hits
                }
            });

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