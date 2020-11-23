
import { Red } from 'node-red';
import { createSandbox, sendResults } from './sandbox';
import { CronJob } from 'cron';
import { ElasticNode } from './elastic-config';
export interface ElasticSearchNode extends ElasticNode {
    timerangeFrom: any;
    timerangeTo: any;
    query(query: any);
    size: any;
    outputalways: boolean;
    script: any;

}

// Define the type of the body for the Search request
interface SearchBody {
    query: {
        match: { foo: string }
    }
}

// Complete definition of the Search response
interface ShardsResponse {
    total: number;
    successful: number;
    failed: number;
    skipped: number;
}

interface Explanation {
    value: number;
    description: string;
    details: Explanation[];
}

export interface SearchResponse<T> {
    took: number;
    timed_out: boolean;
    _scroll_id?: string;
    _shards: ShardsResponse;
    hits: {
        total: number;
        max_score: number;
        hits: Array<{
            _index: string;
            _type: string;
            _id: string;
            _score: number;
            _source: T;
            _version?: number;
            _explanation?: Explanation;
            fields?: any;
            highlight?: any;
            inner_hits?: any;
            matched_queries?: string[];
            sort?: string[];
        }>;
    };
    aggregations?: any;
}

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

        let context = createSandbox(node, RED);
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
            node.job = new CronJob(cron, search.bind(null, node, null, context));
            node.job.start();

            node.on('close', () => {
                node.job.stop();
            });
        }

        node.on('input', async (msg, send, done) => {
            await search(node, msg, context, send, done)
        });
    }


    async function search(node: ElasticSearchNode, msg, context, send, done) {
        try {
            if (!msg) {
                msg = { payload: {} }
            }
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

            //@ts-ignore
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

            const body = await node.config.client.search<SearchResponse<any>>(options)
            let hits = [];
            if (body && body.body.hits) {
                for (let item of body.body.hits.hits) {
                    hits.push(Object.assign({
                        _id: item._id,
                        index: item._index
                    }, item._source))
                }
            }
            //@ts-ignore
            if (node.outputalways || body.body.hits.total.value > 0)
                msg.payload = {
                    index: node.index,
                    query: node.query,
                    //@ts-ignore
                    total: body.body.hits.total.value,
                    items: hits
                }

            context.msg = msg;
            context.send = send;
            context.done = done;

            node.script.runInContext(context);
            sendResults(node, send, msg._msgid, context.results, false, RED, context);

        } catch (e) {
            if (done)
                done(e);
            sendResults(node, send, msg._msgid, {
                total: 0,
                hits: []
            }, false, RED, context);
        }
    }


    RED.nodes.registerType("elastic-search", templateNode);
}