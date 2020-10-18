function getBalance (responseJson) {
    if (responseJson.id !== 'get_balance') {
        throw new Error('invalid JSON response');
    }
    return responseJson.result.amount
}

function processNearTransaction(responseJson) {
    // Identify if transaction is flux related
    // Determine event type for each transfer we are interested in
    // Return event
}

module.exports = {
    getBalance,
    processNearTransaction
};
