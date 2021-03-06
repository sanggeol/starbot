
'use strict'

const express = require('express')
const proxy = require('express-http-proxy')
const bodyParser = require('body-parser')
const _ = require('lodash')
const config = require('./config')
const commands = require('./commands')

const navigation = require('./navigation')

const defaultCommand = require('./commands/help')
const pickCommand = require('./commands/pick')

const addCommand = require('./commands/add')

let bot = require('./bot')

let app = express()

if (config('PROXY_URI')) {
  app.use(proxy(config('PROXY_URI'), {
    forwardPath: (req, res) => { return require('url').parse(req.url).path }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


app.post('/commands/action', (req, res) => {
   
    console.log("aciton test")

    let payload = req.body

    var tmp = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string
   
    addCommand.handler(payload,tmp.actions[0].name,res)
    
})

app.post('/commands/starbot', (req, res) => {
  let payload = req.body

  if (!payload || payload.token !== config('STARBOT_COMMAND_TOKEN')) {
    let err = '✋  Star—what? An invalid slash token was provided\n' +
              '   Is your Slack slash token correctly configured?'
    console.log(err)
    res.status(401).end(err)
    return
  }

  //return current time GMT 0   
  var c_date = new Date()
  var hours = c_date.getHours()
  console.log(hours)
  //서울시간(GMT 9 으로 변경하기 위해 9를 더해야함 )
  hours += 9
  if(hours >= 24){
    hours -= 24
  }
  console.log(hours + ": Seoul")

  //todo check
  //today history
  // if(payload.text == "" && ( hours < 11 || hours > 13 ) )
  // {
  //      res.end("죄송합니다. 영업시간이 아닙니다.")
  //      return
  // }
      
  console.log(payload)
  let cmd = _.reduce(commands, (a, cmd) => {
            return payload.text.match(cmd.pattern) ? cmd : a
            }, defaultCommand)
  if(payload.text==""){
    cmd = pickCommand
  }
  cmd.handler(payload, res)
 })

app.listen(config('PORT'), (err) => {
  if (err) throw err

  console.log(`\n🚀  Lunchtoday LIVES on PORT ${config('PORT')} 🚀`)

  if (config('SLACK_TOKEN')) {
    console.log(`🤖  beep boop: @lunchtoday is real-time\n`)
    bot.listen({ token: config('SLACK_TOKEN') })
  }
})
