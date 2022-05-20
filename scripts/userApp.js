const timers = require("./timers");
const { getAll } = require("./logs");

const addTimerEvents = (app) => {
  app.get("/api/timers", getAll(), (req, res) => {
    console.log(req.timer);
    if (req.query.isActive === "true") {
      const allElems = req.timer.timers.filter((e) => e.isActive);
      allElems.map((e) => timers.changeTic(e));
      res.send(allElems);
    } else {
      res.send(req.timer.timers.filter((e) => !e.isActive));
    }
  });

  app.post(`/api/timers/:id/stop`, getAll(), (req, res) => {
    if (req.timer) {
      const currElem = req.timer.timers.find((e) => e.id === req.params.id);
      timers.stopTimer(currElem);
    }
  });

  app.post("/api/timers", getAll(), (req, res) => {
    if (req.timer) {
      const { id, elem } = timers.createTimer(req.body.description);
      req.timer.timers.push(elem);
      res.send({ id: id });
    }
  });
};

module.exports = addTimerEvents;
