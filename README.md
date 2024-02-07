# Bamboo Out-of-Office Slack App

A Slack app for users of BambooHR to share who is going to be out of the office. Supports PTO and holidays.

See [.env.sample](.env.sample) for required environment variables.

## Getting Started

1. [Remix on Glitch](https://glitch.com/edit/#!/remix/bamboo-outofoffice-slack) (easiest
   for a quick start since Glitch will host your app and provide a URL for
   Slack to talk directly to; [more info on Glitch](https://glitch.com/about)).
   Alternatively, and more traditionally, you may clone this repo and get the app
   running somewhere that it will be accessible on the web.
1. Copy [`.env.sample`](.env.sample) to `.env`.
1. Create a new app in the [Slack "Your Apps"
   dashboard](https://api.slack.com/apps).
1. In your newly created Slack app configuration, Create a slash command via the
   "Slash Commands" tab in the sidebar and set the request URL to your app:
   `https://your-app-name-here.glitch.me/slack/events`
1. Configure the required environment variables in `.env`:
   1. `SLACK_SIGNING_SECRET`: Navigate to the "Basic Information" tab and use
      the "Signing Secret".
   1. `SLACK_BOT_TOKEN`: Navigate to the "Install App" tab and use the "Bot
      User OAuth Access Token" value.
   1. `BAMBOO_API_TOKEN`: Create and configure a [BambooHR API
      token](https://documentation.bamboohr.com/docs/getting-started).
1. Configure the optional environment variables in `.env`. These values are
   utilized when the app is triggered from an external source such as a cron or
   Jenkins job as opposed to a "slash command" from within Slack.
   1. `DEFAULT_CHANNEL_ID` / `SANDBOX_CHANNEL_ID` (optional): Populate these
      values with the Slack channel ID's where you want the app to post
      notifications. The easiest way to get these values is to load your Slack
      workspace in a web browser (as opposed to the Slack app) and grab the
      channel id's from the address bar.
1. Customize default values:
   1. `DEBUG_MODE`: Setting this value to `true` results in the
      `SANDBOX_CHANNEL_ID` being used instead of the `DEFAULT_CHANNEL_ID`.

## Example Trigger Request

To trigger the app from outside of Slack:

1. Ensure `DEFAULT_CHANNEL_ID`, `SANDBOX_CHANNEL_ID`, and `BAMBOO_API_TOKEN` are
   configured as described above.
1. Make a POST request with your token in the following format:

```bash
curl --fail -X POST \
  'https://your-app-name-here.glitch.me/triggers?token=YOUR_BAMBOO_API_TOKEN_HERE'
```
