// server.js

const config = require('./config');

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Configure Slack web client.
const { WebClient } = require('@slack/client');
const slackWebClient = new WebClient(config.slackToken);

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (request, response, next) => {
  response.send('<h2>The CHQ Out of Office app is running</h2> <p>Follow the' +
  ' instructions in the README to configure the Slack App and your' +
  ' environment variables.</p>');
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
app.post('/commands', (request, response, next) => {
  if (request.body.token !== config.slackVerificationToken || request.body.command !== '/outofoffice') {
    response.status(403);
    return response.send();
  }

  axios
    .get(config.bamboo.whosOutUrl, config.bamboo.apiRequestConfig)
    .then((response) => {
      if (response.status === 200) {
        const payload = {
          channel: request.body.channel_id,
          user: request.body.user_id,
          text: config.whosOutMessageText,
          attachments: [
            {
              blocks: whosOutPayloadBlocks(response)
            }
          ]
        };
        return slackWebClient.chat.postEphemeral(payload);
      }
      return next();
    })
    .catch((error) => {
      console.error(error);
    });
  response.status(200);
  return response.send();
});

// This endpoint is triggered by a non-Slack event like a Jenkins job for a 
// weekly notification in the configured announcements channel.
app.post('/triggers', (request, response, next) => {
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
        return slackWebClient.chat.postMessage(payload);
      }
      return next();
    })
    .catch(error => {
      console.error(error);
    });
  response.status(200);
  return response.send();
});

// Listen for requests.
const listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});
