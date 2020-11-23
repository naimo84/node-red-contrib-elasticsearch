
let elasticsearch = require("elasticsearch");
import { Client } from 'elasticsearch'
import { Node } from 'node-red';

export interface ElasticConfig extends Node {
    client: Client;
    server: any;
    timeout: any;
    apiVersion: any;
    username: any;
    password: any;
}

export interface ElasticNode extends Node{
    config: ElasticConfig;
     index: any; 
}

module.exports = function (RED: any) {

    function serverConfigNode(config) {

        var node = this;
        RED.nodes.createNode(node, config);

        node.server = config.server;
        node.name = config.name;
        node.username = config.username;
        node.password = config.password;
        if (config.timeout) {
            node.timeout = config.timeout;
        } else {
            node.timeout = 30000;
        }
        node.apiVersion = config.apiVersion;

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
                node.client = new elasticsearch.Client({
                    hosts: [
                        node.server
                    ],
                    requestTimeout: node.timeout,
                    apiVersion: node.apiVersion,
                    ssl: {
                        rejectUnauthorized: false
                    },
                    httpAuth: `${node.username}:${node.password}`
                });
            }
        } catch (err) {
            node.error("createClient - " + err);
        }
    }



    RED.nodes.registerType("elastic-config", serverConfigNode);
}