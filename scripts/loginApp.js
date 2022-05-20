const bodyParser = require("body-parser");
const logs = require("./logs");
const express = require("express");
const cookieParser = require("cookie-parser");
const addTimerEvents = require("./userApp");
const queryString = require('query-string');
const crypto = require('crypto');
const { Api } = require('telegram');
const BigInt = require('big-integer');
const { Telegraf } = require('telegraf')
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(express.static("public"));
app.set("view engine", "njk");
addTimerEvents(app);

app.get("/", logs.auth(), (req, res) => {
  res.render("index", {
    user: req.user,
    authError: req.query.authError === "true" ? "Wrong username or password" : req.query.authError,
    signError: req.query.signError === "true" ? "That username already exists" : req.query.signError,
    signSuccess: req.query.signSuccess === "true" ? "You signed-up succesfully" : req.query.signSuccess,
    timer: req.timer,
  });
});

app.post('/cafe/api', bodyParser.urlencoded({ extended: false }), async (req, res)=>{
  const token = '';
  const bot = new Telegraf(token);
  const data =  req.body;
  console.log(data);
  data.order_data = JSON.parse(data.order_data);
  const _auth = {...queryString.parse(decodeURIComponent(data._auth))};
  _auth.user = JSON.parse(_auth.user);
  data._auth = _auth;
  const result = logs.getText(data.order_data);
  await bot.telegram.answerWebAppQuery(data._auth.query_id,
    JSON.stringify({type:'article', id:'213123123', title:'ORDER', input_message_content:
        {message_text:result.text,parse_mode:'html'}}));
  await bot.telegram.sendInvoice(data._auth.user.id,{
      //need_phone_number: true, need_shipping_address: true,
      provider_token:'', send_phone_number_to_provider: true,title:'ОПЛАТА ЗАКАЗА НОМЕР 123', description:'das',currency: 'RUB', prices: [{label: 'Руб', amount: 1000}],

    // payload:'dsa',
    //need_name: true,
    //payload: '10.00',
    payload:{amount:{value: '2.00', currency: 'RUB'}, payment_method_data: {type: 'bank_card'}, description: 'Оплата заказа',
    items: data.order_data.map(e=>{return {description: 'a', quantity: e.count, amount: {value: '2.00', currency: 'RUB'}, vat_code:'1'}})
    }
    })
  res.status(200);
});

app.post("/login", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const user = await logs.findUserByUserName(username);
  if (!user || !(await logs.bcrypt.compare(password, user.password))) {
    return res.redirect("/?authError=true");
  }
  const sessionId = await logs.createSession(user._id);
  res.cookie("sessionId", sessionId, { httpOnly: true }).redirect("/");
});

app.get("/logout", logs.auth(), async (req, res) => {
  if (!req.user) {
    return res.redirect("/");
  }
  await logs.deleteSession(req.sessionId);
  res.clearCookie("sessionId").redirect("/");
});

app.post("/signup", bodyParser.urlencoded({ extended: false }), async (req, res) => {
  const { username, password } = req.body;
  const allUsers = await logs.allNames();
  if (allUsers.includes(username)) {
    return res.redirect("/?signError=true");
  }
  res.redirect("/?signSuccess=true");
  logs.updateUsers(username, password);
});

module.exports = app;
