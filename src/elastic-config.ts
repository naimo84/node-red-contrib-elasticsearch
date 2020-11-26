import { Client } from '@elastic/elasticsearch'
import { Node } from 'node-red';

export interface ElasticConfig extends Node {
    client: Client;
    server: any;
    timeout: any;
    apiVersion: any;
    credentials: any;
}

export interface ElasticNode extends Node {
    config: ElasticConfig;
    index: any;
}

module.exports = function (RED: any) {

    function serverConfigNode(config) {

        var node = this;
        RED.nodes.createNode(node, config);

        node.server = config.server;
        node.name = config.name;
        if (config.timeout) {
            node.timeout = config.timeout;
        } else {
            node.timeout = 30000;
        }

        createClient(node);

        node.on("error", function (error) {
            node.error("Elastic Server Error - " + error);
        });

        node.on("close", function (done) {
            if (this.localServer) {
                //stopServer(this);
            }
            done();
        });
    }

    function createClient(node: ElasticConfig) {
        try {
            if (!node.client) {
                node.client = new Client({
                    node: node.server,
                    ssl: {
                        rejectUnauthorized: false
                    },
                    auth: {
                        username: node.credentials.username,
                        password: node.credentials.password
                    },
                    requestTimeout: node.timeout
                });
            }
        } catch (err) {
            node.error("createClient - " + err);
        }
    }



    RED.nodes.registerType("elastic-config", serverConfigNode, {
		credentials: {
			password: { type: 'password' },
			username: { type: 'text' }
		}
	});
}