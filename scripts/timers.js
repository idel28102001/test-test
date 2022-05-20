const { nanoid } = require("nanoid");

const stopTimer = (elem) => {
  elem.isActive = false;
  elem.end = Date.now();
  elem.duration = elem.end - elem.start;
};

const createTimer = (description) => {
  const id = nanoid();
  return { id: id, elem: { start: Date.now(), description, isActive: true, id: id, progress: 0 } };
};

const changeTic = (elem) => {
  elem.progress = Date.now() - elem.start;
};

module.exports = { stopTimer, createTimer, changeTic };
