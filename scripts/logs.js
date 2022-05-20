require('dotenv').config();
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const { StringSession } = require('telegram/sessions');
const { TelegramClient, Api } = require('telegram');
const DB = {
  users: [],
  sessions: {},
  timers: [],
};

const orders = [{id:1, price:4.99, text:'🍔 Burger'},{id:2, price:1.49, text:'🍟 Fries'},{id:3, price:3.49, text:'🌭 Hotdog'},{id:4, price:3.99, text:'🌮 Tako'},
  {id:5, price:7.99, text:'🍕 Pizza'},{id:6, price:1.49, text:'🍩 Donut'},{id:7, price:1.99, text:'🍿 Popcorn'},{id:8, price:1.49, text:'🥤 Coke'},
  {id:9, price:10.99, text:'🍰 Cake'},{id:10, price:5.99, text:'🍦 Icecream'}, {id:11, price:3.99, text:'🍪 Cookie'},{id:12, price:7.99, text:'🍮 Flan'}];


const getText = (orderData)=> {
  let text = 'Order summary:\n\n';
  let sum = 0;
  for (const {id, count} of orderData) {
    const ord = orders.find(e=>e.id===id);
    const currSum = Math.floor(ord.price*count*100)/100;
    sum+=currSum;
    const currText = `${ord.text} x${count} — <b>$${currSum}</b>\n`;
    text+=currText;
  }
  text+=`\nTotal — <b>$${sum}</b>`;
  return {text, payment: sum};
}


const registerTelegramBot = async (token)=> {
  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH;
  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });
  try {
    await client.start({
      botAuthToken: token,
    });
  } catch (e) {
    throw new Error(e);
  }
  return client.session.save();
}

const getTelegramClient = async (session = '', auth)=> {
  const apiId = Number(process.env.API_ID);
  const apiHash = process.env.API_HASH;
  const stringSession = new StringSession(session); // Создаём сессию
  const client = new TelegramClient( // Создаем клиента
    stringSession,
    apiId,
    apiHash,
    { connectionRetries: 5 }
  )
  await client.connect() // Конектимся
  if (!await client.checkAuthorization() && session && auth) { // Проверяем - действительна ли сессия
    throw new Error('Сессия недействительна');
  }
  return client; // Вовзращаем
}

const findUserByUserName = async (username) => DB.users.find((u) => u.username === username);

const findUserBySessionId = async (sessionId) => {
  const userId = DB.sessions[sessionId];
  if (!userId) return;
  return DB.users.find((u) => u._id === userId);
};

const createSession = async (userId) => {
  const sessionId = nanoid();
  DB.sessions[sessionId] = userId;
  return sessionId;
};

const deleteSession = async (sessionId) => {
  delete DB.sessions[sessionId];
};

const createUser = async (username, password) => {
  const pass = await bcrypt.hash(password, 10);
  return { _id: nanoid(), username, password: pass };
};

const updateUsers = async (username, password) => {
  const elem = await createUser(username, password);
  DB.users.push(elem);
};

const getTimers = async (id) => {
  let result = DB.timers.find((e) => e.id === id);
  if (!result) {
    result = { id, timers: [] };
    DB.timers.push(result);
  }
  return result;
};
const auth = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }
  const user = await findUserBySessionId(req.cookies["sessionId"]);
  req.user = user;
  req.sessionId = req.cookies["sessionId"];
  next();
};

const getAll = () => async (req, res, next) => {
  if (!req.cookies["sessionId"]) {
    return next();
  }
  const user = await findUserBySessionId(req.cookies["sessionId"]);
  if (user) {
    req.timer = await getTimers(user._id);
  }
  next();
};

const allNames = async () => {
  const allUsers = [];
  DB.users.forEach((e) => {
    allUsers.push(e.username);
  });
  return allUsers;
};

module.exports = {
  findUserByUserName,
  findUserBySessionId,
  createSession,
  deleteSession,
  auth,
  allNames,
  updateUsers,
  DB,
  getAll,
  bcrypt,
  registerTelegramBot,
  getTelegramClient,
  getText
};
