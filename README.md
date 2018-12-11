# roommate-bot

## Usage

```
npm install
```

```
bootbot start
```
Steps to operate this project
Installation Steps:
1. Clone this repo to your device.
2. Install mongodb for your respective operating system.
3. Afterwards, open a separate terminal window and run the command "mongod"
4. You shouldn't need to, but just to be safe install bootbot globally using the following command: 
```
npm install bootbot-cli -g
```
5. Run 
```
npm install
```

Facebook Steps:

6. You need to make a Facebook Page for the bot
7. In order, to get set up the config file, you're going to need to set up a website application on Facebook's Developer Website <https://developers.facebook.com/docs/messenger-platform/getting-started/quick-start>.
8. Once you made the app. You can get your appSecret code in the settings of the app. It will be hidden, so use your password to view it.
9. You can also get your accessToken from the website on the first page when you select the page associated with the app.
10. The verifyToken is something YOU make up. Make sure that you like it and plug it into the webhooks subscription section of the app portal.  :)
11. There you will also be able to place your localtunnel host if you're hosting from your personal device. Look below for how to have the program develop one for you or how to get it through other means.

Finally:
Run 
```
bootbot start 
```
to get the project up and running through a localtunnel. Unless otherwise you prefer to set up your own. Common ways are through ngrok for example.
