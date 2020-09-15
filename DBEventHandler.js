const DBEventHandler = (io, data) => {
    switch (data.channel) {
        // TODO: JSON parse payload
        case "update_markets":
            io.emit("UpdateMarkets", JSON.parse(data.payload))
            break;
        case "update_orders":
            io.emit("UpdateOrders", JSON.parse(data.payload))
            break;
        default:
            console.log("unidentified event found", data.channel)
    }

}

module.exports = DBEventHandler;