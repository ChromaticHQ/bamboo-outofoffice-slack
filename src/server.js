// server.js

const config = require('./config');

const bodyParser = require('body-parser');
const axios = require('axios');
const { App, LogLevel, ExpressReceiver } = require('@slack/bolt');
const receiver = new ExpressReceiver({
  signingSecret: config.slackSigningSecret,
});
const app = new App({
  receiver,
  token: config.slackBotToken,
  signingSecret: config.slackSigningSecret,
  logLevel: LogLevel.DEBUG,
});

const whosOutPayloadBlocks = (response) => {
  // Team out of office data.
  const blocks = response.data.map(function(timeOffEntry) {
    // Create new Date objects from each of the entry’s dates, and produce a
    // locale string for each.
    const timeOffStart = new Date(timeOffEntry.start)
      .toLocaleDateString('en-US', config.dateFormatOptions);
    const timeOffEnd = new Date(timeOffEntry.end)
      .toLocaleDateString('en-US', config.dateFormatOptions);

    const payloadBlock = {
      type: 'section',
      text: {
        type: 'mrkdwn'
      }
    };

    if (timeOffEntry.type == 'holiday') {
      payloadBlock.text.text = `*_Holiday:_ ${timeOffEntry.name}*\nChromatic holiday on _${timeOffStart}_.`;
    } else if (timeOffStart === timeOffEnd) {
      payloadBlock.text.text = `*${timeOffEntry.name}*\nOut of office on _${timeOffStart}_.`;
    } else {
      payloadBlock.text.text = `*${timeOffEntry.name}*\nOut of office from _${timeOffStart}_ to _${timeOffEnd}_.`;
    }
    return payloadBlock;
  });

  // Footer.
  blocks.push({
    type: 'divider'
  });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: 'For more info, contact <@hr>.'
      }
    ]
  });
  return blocks;
}

// This endpoint is hit when a slash command for this app is triggered in Slack.
app.command('/outofoffice', async ({ command, ack, respond }) => {
  // Acknowledge Slack command request.
  await ack();
  
  if (config.debugMode) {
    console.log(command);
  }

  axios
    .get(config.bamboo.whosOutUrl, config.bamboo.apiRequestConfig)
    .then((response) => {
      if (response.status === 200) {
        const payload = {
          channel: command.channel_id,
          user: command.user_id,
          text: config.whosOutMessageText,
          attachments: [
            {
              blocks: whosOutPayloadBlocks(response)
            }
          ]
        };
        return respond(payload);
      }
      return next();
    })
    .catch((error) => {
      console.error(error);
    });
});

// This endpoint is triggered by a non-Slack event like a GitHub Actions
// workflow for a weekly notification in the configured announcements channel.
receiver.app.post('/triggers', (request, response, next) => {
  if (request.query.token !== config.chromaticToken) {
    response.status(403);
    return response.send();
  }
  
  axios
    .get(config.bamboo.whosOutUrl, config.bamboo.apiRequestConfig)
    .then(response => {
      if (response.status === 200) {
        // Allow overriding of #chromatic default with sandbox channel.
        const channelId = config.debugMode ? config.channels.sandboxId : config.channels.announcementsId;
        console.log(`Debug mode: ${config.debugMode ? 'ON' : 'OFF'}`);
        console.log(`Sending notification to channel: ${channelId}`);
        
        payload = {
          channel: channelId,
          text: config.whosOutMessageText,
          attachments: [
            {
              blocks: whosOutPayloadBlocks(response)
            }
          ]
        };
        return app.client.chat.postMessage(payload);
      }
      return next();
    })
    .catch(error => {
      console.error(error);
    });
  response.status(200);
  return response.send();
});

receiver.app.get('/', (_, res) => {
  // Respond 200 OK to the default health check method.
  res.status(200).send();
});

(async () => {
  // Start the app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');
})();