const express = require('express')
const bodyParser = require('body-parser')
const {pool, listener} = require('./config')
const cors = require('cors');
const rateLimit = require("express-rate-limit")
const compression = require("compression");
const handleDBEvent = require("./DBEventHandler");
const helmet = require("helmet");
const markets = require("./api/markets");
const market = require("./api/market");
const history = require("./api/historicData");
const orderbook = require("./api/orderbook");
const user = require("./api/user");
const earnings = require("./api/earnings");

const app = express()
var http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(compression())
app.use(helmet())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(cors({credentials: true, origin: "*"}));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 300,
})
app.use(limiter);

app.get("/health_check", (req, res, next) => {
  res.status(200).send("success");
});

app.use("/markets", (req, res, next) => {
  req.pool = pool;
  next();
}, markets);

app.use("/market", (req, res, next) => {
  req.pool = pool;
  next();
}, market);

app.use("/history", (req, res, next) => {
  req.pool = pool;
  next();
}, history);

app.use("/orderbook", (req, res, next) => {
  req.pool = pool;
  next();
}, orderbook);

app.use("/user", (req, res, next) => {
  req.pool = pool;
  next();
}, user);

app.use("/earnings", (req, res, next) => {
  req.pool = pool;
  next();
}, earnings);

async function connectListener() {
  await listener.connect()
  await listener.query('LISTEN update_orders');
  // await client.query('LISTEN update_markets');

  listener.on("notification", message => {
    console.log("notified")
    handleDBEvent(io, message);
  })
}

connectListener()

http.listen(process.env.PORT || 3000, () => {
  console.log(`Server listening`)
})
