
import { Red, Node } from 'node-red';
import { CronJob } from 'cron';

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
        node.index = config.index;

        if (config.timeout && config.timeout !== "" && config.timeoutUnits && config.timeoutUnits !== "") {
            let cron = '0 0 * * * *';

            switch (config.timeoutUnits) {
                case 'seconds':
                    cron = `*/${config.timeout} * * * * *`;
                    break;
                case 'minutes':
                    cron = `0 */${config.timeout} * * * *`;
                    break;
                case 'hours':
                    cron = `0 0 */${config.timeout} * * *`;
                    break;
                case 'days':
                    cron = `0 0 0 */${config.timeout} * *`;
                    break;
                default:
                    break;
            }
            node.job = new CronJob(cron, search.bind(null, node));
            node.job.start();

            node.on('close', () => {
                node.job.stop();
            });
        }

        node.on('input', async (msg, send, done) => {
            search(node, msg, send, done)
        })
    }


    async function search(node, msg, send, done) {
        send = send || function () { node.send.apply(node, arguments) }
        try {
            const result = await node.config.client.indices.get({
                index: node.index || '*'
            })

            send({
                payload: result
            });
            if (done) done()
        } catch (e) {
            send({
                payload: false,
                error: e
            });
            if (done) done(e)

        }
    }


    RED.nodes.registerType("elastic-indices", templateNode);
}