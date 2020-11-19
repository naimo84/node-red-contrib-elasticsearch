
import { Red, Node } from 'node-red';

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

      

            const result = await node.config.client.ping()
           

            node.send({
                payload:result
            });

        } catch (e) {
            console.error(e);
            node.send({
                payload:false,
                error:e
            });
        }
    }


    RED.nodes.registerType("elastic-ping", templateNode);
}