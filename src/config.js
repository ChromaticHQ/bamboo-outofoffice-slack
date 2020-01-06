module.exports = {
  debugMode: process.env.DEBUG_MODE === 'true',
  slackToken: process.env.SLACK_TOKEN,
  slackVerificationToken: process.env.SLACK_VERIFICATION_TOKEN,
  chromaticToken: process.env.CHROMATIC_TOKEN,
  channels: {
    announcementsId: 'C03FBG24G',
    sandboxId: 'D19NAUQE7'
  },
  whosOutMessageText: 'Hey team! A friendly reminder on who is out for the next two weeks and upcoming holidays:',
  dateFormatOptions: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  bamboo: {
    whosOutUrl: 'https://api.bamboohr.com/api/gateway.php/chromatic/v1/time_off/whos_out/',
    apiRequestConfig: {
      headers: {
        authorization: 'Basic ODAwNjRmMTFkYjdmOGVhOTEwZGY1ZDk4MzFjYTQ3ZmQ3MjNlMWUzZTp4',
        accept: 'application/json'
      }
    }
  }
};
