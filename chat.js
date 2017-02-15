const _ = require('lodash');
const P = require('bluebird');
const cogs = require('cogs-sdk');
const moment = require('moment');
const blessed = require('blessed');
const durations = require('durations');
const readline = require('readline');

const EventEmitter = require('events');

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

function ui(chatter) {
  const screen = blessed.screen({
    smartCSR: true,
    dockBorders: true,
  });

  let inputHeight = 6;
  let buttonWidth = 12;
  let inputWidth = screen.width - buttonWidth;
  let firstHeight = screen.height - inputHeight;

  let container = blessed.box({
    parent: screen,
    ignoreLocked: ['C-c'],
  });

  let log = blessed.box({
    parent: container,
    top: 0,
    left: 0,
    right: 0,
    height: firstHeight,
    width: '100%',
    border: {
      type: 'line',
      fg: '#00ff00',
    },
    scrollable: true,
    scrollbar: {
      bg: 'blue',
    },
    mouse: true,
  });

  let input = blessed.Textbox({
    parent: container,
    left: 0,
    bottom: 0,
    height: inputHeight,
    width: inputWidth,
    border: {
      type: 'line',
      fg: '#ff0000',
    },
    scrollable: true,
    scrollbar: {
      bg: 'blue',
    },
    mouse: true,
    inputOnFocus: true,
    keys: true,
  });

  let button = blessed.Button({
    parent: container,
    right: 0,
    bottom: 0,
    height: inputHeight,
    width: buttonWidth,
    border: {
      type: 'line',
      fg: '#0000ff',
    },
  });

  button.on('click', () => input.submit());

  screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
  });

  input.on('submit', text => {
    chatter.emit('publish', text);
  });

  chatter.on('message', message => {
    log.insertBottom(message);
    log.setScrollPerc(100);
    input.clearValue();
    input.focus();
    screen.render();
  });

  input.focus();
  screen.render();
}

function chat(handle, username, channel) {
  const chatter = new EventEmitter();

  const messageHandler = ({message, timestamp}) => {
    chatter.emit('message', `[${moment(timestamp).toISOString()}] ${message}`);
  };

  const publish = message => {
    handle.publishWithAck(channel, `${username} > ${message}`)
      .catch(error => console.error(`Failed to publish message:`, error));
  };

  handle.subscribe(channel, messageHandler)
  .then(subscribedChannels => {
    publish("Hey everybody. I'm here. Party can start.");
  });

  chatter.on('publish', publish);
  chatter.on('close', () => handle.close());

  return chatter;
}

function getUsername() {
  return new P(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter your name> ', username => {
      rl.close();
      resolve(username);
    });
  });
}

function getChannel() {
  return new P(resolve => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    rl.question('Enter the channel> ', channel => {
      rl.close();
      resolve(channel);
    });
  });
}

function run() {
  if (process.argv.length != 4) {
    console.log('usage: chat <username> <channel>');
    process.exit(0);
  }

  const user = process.argv[2];
  const chan = process.argv[3];

  getConfig()
  .then(({keys, options}) => cogs.pubsub.connect(keys, options))
  .then((handle) => ui(chat(handle, user, chan)))
  //.then(handle => getUsername().then(user => ({handle, user})))
  //.then(({handle, user}) => getChannel().then(chan => ({handle, user, chan})))
  //.then(({handle, user, chan}) => ui(chat(handle, user, chan)))
  .catch(error => console.error(`Error setting up chat client:`, error));
}

run();
