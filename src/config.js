module.exports = {
  debugMode: process.env.DEBUG_MODE === 'true',
  slackBotToken: process.env.SLACK_BOT_TOKEN,
  slackVerificationToken: process.env.SLACK_VERIFICATION_TOKEN,
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
  bambooAPIToken: process.env.BAMBOO_API_TOKEN,
  orgName: process.env.ORG_NAME,
  channels: {
    announcementsId: process.env.DEFAULT_CHANNEL_ID,
    sandboxId: process.env.SANDBOX_CHANNEL_ID
  },
  whosOutMessageText: 'Hey team! A friendly reminder on who is out for the next two weeks and upcoming holidays:',
  dateFormatOptions: {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  },
  bamboo: {
    whosOutUrl: `https://api.bamboohr.com/api/gateway.php/${process.env.BAMBOO_ORG_NAME}/v1/time_off/whos_out/`,
    apiRequestConfig: {
      headers: {
        authorization: 'Basic ODAwNjRmMTFkYjdmOGVhOTEwZGY1ZDk4MzFjYTQ3ZmQ3MjNlMWUzZTp4',
        accept: 'application/json'
      }
    }
  }
};
