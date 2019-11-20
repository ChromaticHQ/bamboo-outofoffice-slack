// server.js

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

// Configure Slack web client.
const { WebClient } = require('@slack/client');

const slackWebClient = new WebClient(process.env.SLACK_TOKEN);
const slackVerificationToken = process.env.SLACK_VERIFICATION_TOKEN;

const chromaticToken = process.env.CHROMATIC_TOKEN;

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const announcementsChannelId = 'C03FBG24G';
const sandboxChannelId = 'D19NAUQE7';
const debugMode = (process.env.DEBUG_MODE === 'true');

const bambooApiWhosOutUrl = 'https://api.bamboohr.com/api/gateway.php/chromatichq/v1/time_off/whos_out/';

const whosOutMessageText = 'Hey team! A friendly reminder on who is out for the next two weeks:';

app.get('/', (request, response, next) => {
  response.send('<h2>The CHQ Out of Office app is running</h2> <p>Follow the' +
  ' instructions in the README to configure the Slack App and your' +
  ' environment variables.</p>');
});

const whosOutPayloadBlocks = (response) => {
  const blocks = [];

  // Team out of office data.
  response.data.forEach(function(timeOffEntry) {
    const timeOffStartDate = new Date(timeOffEntry.start);
    const timeOffEndDate = new Date(timeOffEntry.end);
    const dateOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    };

    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `*${
          timeOffEntry.name
        }*\nOut of office from _${timeOffStartDate.toLocaleDateString(
          "en-US",
          dateOptions
        )}_ to _${timeOffEndDate.toLocaleDateString("en-US", dateOptions)}_.`
      }
    });
  });

  // Footer.
  blocks.push({
    type: "divider"
  });
  blocks.push({
    type: "context",
    elements: [
      {
        type: "mrkdwn",
        text: "For more info, contact <@hr>."
      }
    ]
  });
  return blocks;
}

const bambooApiRequestConfiguration = {
  headers: {
    authorization:
      "Basic ODAwNjRmMTFkYjdmOGVhOTEwZGY1ZDk4MzFjYTQ3ZmQ3MjNlMWUzZTp4",
    accept: "application/json"
  }
};

app.post('/commands', (request, response, next) => {
  if (request.body.token === slackVerificationToken && request.body.command === '/outofoffice') {
    axios
      .get(bambooApiWhosOutUrl, bambooApiRequestConfiguration)
      .then((response) => {
        if (response.status === 200) {
          payload = {
            channel: request.body.channel_id,
            user: request.body.user_id,
            text: whosOutMessageText,
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
  }
  return next();
});

// This function is to be triggered by a non-Slack event like a Jenkins job for a weekly notification.
app.post('/outofoffice', (request, response, next) => {
  if (request.query.token !== chromaticToken) {
    response.status(403);
    return response.send();
  }

  // Allow overriding of #chromatic default with sandbox channel.
  const channelId = debugMode ? sandboxChannelId : announcementsChannelId;
  console.log(channelId);
  
  axios
    .get(bambooApiWhosOutUrl, bambooApiRequestConfiguration)
    .then(response => {
      if (response.status === 200) {
        payload = {
          channel: debugMode ? sandboxChannelId : announcementsChannelId,
          text: whosOutMessageText,
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
