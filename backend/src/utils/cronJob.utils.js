const cron = require("node-cron");
const cronJobs = {};
const registerCronJob = (key, schedule, fn, opts = { scheduled: true, timezone: "Asia/Kolkata" }) => {
  if (cronJobs[key]) {
    cronJobs[key].stop();
    delete cronJobs[key];
  }
  cronJobs[key] = cron.schedule(schedule, fn, opts);
};

module.exports = {
  registerCronJob,
};