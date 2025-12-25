const express = require('express')
const app = express()
const processor = require('./processor.js')
const helpers = require('./helpers.js')

app.use(express.json({limit: '50mb'}))

const db = require('./db.js')

app.get('/sms/', (req, res) => {
    res.end('It works! Scheduled sms')
})

app.post('/sms/add', async (req, res) => {
    const params = req.body
    res.end(
        JSON.stringify({
            ok: true,
            params: params
        })
    )
    await db.add(db.smsTableName, {
        host: params.host,
        ids: params.ids,
        status: 0,
        time: params.timestamp, // in milliseconds
        create_at: helpers.toSqlDateString(new Date()),
    })
})

app.listen(3001, async () => {
    console.log ('Server is listening on port 3001')
    processor.runScheduleHandler()
    processor.runClearDBSchedule()
})

// report error to group
process.on('uncaughtException', async (err, origin) => {
    console.error('uncaughtException')
    await helpers.sendErrorToGroup(err, origin)
    processor.runScheduleHandler()
    processor.runClearDBSchedule()
})