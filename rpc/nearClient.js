const axios = require('axios');
const config = require('config');
const handlers = require('responseHandlers');

class NearClient {
    constructor() {
        this.rpcInstance = axios.create({
            baseURL: config.NODE_URL,
            timeout: config.TIMEOUT,
            headers: config.REQUEST_HEADERS
        });

        this.dbConnection = axios.create({
            baseURL: config.DB_CONNECTION_URL,
            timeout: config.TIMEOUT,
            headers: config.REQUEST_HEADERS,
        })
    }

    async getBalance(accountId) {
        const responseJson = await this.rpcInstance.post('/status', {
            'jsonrpc': '2.0',
            'method': 'view_account',
            'params': {
                'request_type': 'view_account',
                'finality': 'final',
                'account_id': accountId
            },
            'id': 'get_balance',
        });

        const balance = handlers.getBalance(responseJson);

        return this.dbConnection.post('/getBalance', {
            'account_id': accountId,
            'balance': balance
        });
    }

    async getBlock(blockId) {
        const responseJson = await this.rpcInstance.post('/status', {
            'jsonrpc': '2.0',
            'method': 'block',
            'params': {'block_id': blockId},
            'id': 'get_block',
        });

        // Speedup ideas: rather than process each transaction sequentially, map call to get all txn id's and filter against db info
        let events = [];
        for (const chunk in responseJson.result.chunks) {
            const transactionList = await this.getChunk(chunk.chunk_hash);
            for (const transaction in transactionList) {
                let response = handlers.processNearTransaction(transaction);
                if (response) {
                    events.push(response);
                }
            }
        }

        // TODO: Post events to dbConnection
    }

    async getChunk(chunkHash) {
        const responseJson = await this.rpcInstance.post('/status', {
            'jsonrpc': '2.0',
            'method': 'chunk',
            'params': '[' + chunkHash + ']',
            'id': 'get_chunk',
        });
        return responseJson.result.transactions
    }
}

module.exports = {
    NearClient
};
