const _ = require('lodash');
const P = require('bluebird');
const cogs = require('cogs-sdk');
const moment = require('moment');
const blessed = require('blessed');
const durations = require('durations');
const readline = require('readline');

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

function readInput(inputHandler) {
  // For each line of input, call inputHandler
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function prompt() {
    rl.question('> ', answer => {
      inputHandler(answer);
      prompt();
    });
  }

  prompt();
}

function chat(handle, username) {

  const messageHandler = ({message, timestamp}) => {
    console.log(`[${moment(timestamp).toISOString()}] ${message}`);
    //do things with message received
  };

  const publish = message => {
    handle.publishWithAck('channel', `${username} > ${message}`)
      .catch(error => console.error(`Failed to publish message:`, error));
  };

  handle.subscribe('channel', messageHandler)
    .then(subscribedChannels => {
      console.log(`Subscribed to channels: ${subscribedChannels}`); //In this case would output ['channel']
      publish("Hey everybody. I'm here. Party can start.");
      publish("Testing A");
      publish("Testing B");
      publish("Testing C");
      publish("Testing D");
      publish("Testing E");
    });

  readInput(publish);

  console.log(`Socket connection established.`);
  handle.on('close', () => console.log(`Socket closed.`));

  const quitHandler = () => {
    handle.close();
  };
  // Do your magic here, dude.
  var cogs = require("cogs-sdk")
}

function run() {
  getConfig()
  .then(({keys, options}) => cogs.pubsub.connect(keys, options))
  .then(handle => chat(handle, 'Alberto'))
  .catch(error => console.error(`Error setting up chat client:`, error));
}

run();
