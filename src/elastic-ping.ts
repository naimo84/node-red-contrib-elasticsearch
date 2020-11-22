
import { Red, Node } from 'node-red';

module.exports = function (RED: Red) {
    function elasticNode(config: any) {
        RED.nodes.createNode(this, config);
        let configNode = RED.nodes.getNode(config.confignode);
        if (!configNode) {
            this.error("Config is missing!")
            return;
        }
        let node = this;
        node.config = configNode;

        node.on('input', async (msg, send, done) => {
            search(node, msg, send, done);
        })
    }


    async function search(node, msg, send, done) {
        send = send || function () { node.send.apply(node, arguments) }
        try {           
            const result = await node.config.client.ping()

            send({
                payload: result
            });
            if (done) done();
        } catch (e) {           
            send({
                payload: false,
                error: e
            });     
            if (done) done();      
        }
    }


    RED.nodes.registerType("elastic-ping", elasticNode);
}