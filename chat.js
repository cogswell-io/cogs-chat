const _ = require('lodash');
const P = require('bluebird');
const cogs = require('cogs-sdk');
const moment = require('moment');
const blessed = require('blessed');
const durations = require('durations');

const fs = require('fs');
const readFile = P.promisify(fs.readFile);

function coalesce() {
  return _(arguments).filter(arg => !_.isNil(arg)).first();
}

let configFile = coalesce(process.env.COGS_CHAT_CONFIG_FILE, "cogs-chat.json");
let config;
function getConfig() {
  if (!config) {
    config = readFile(configFile)
    .then(raw => JSON.parse(raw))
    .catch(error => {
      console.error(`Error reading config file '${configFile}' :`, error);
      throw error;
    });
  }

  return config;
}

function chat(handle) {
  console.log(`Socket connection established.`);
  handle.on('close', () => console.log(`Socket closed.`));
  handle.close();
  // Do your magic here, dude.
}

function run() {
  getConfig()
  .then(({key, options}) => cogs.pubsub.connect(key, options))
  .then(handle => chat(handle))
  .catch(error => console.error(`Error setting up chat client:`, error));
}

run();
