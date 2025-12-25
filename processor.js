const db = require('./db.js')
const helpers = require('./helpers.js')
const schedule = require('node-schedule')
const scheduledSmsSendApiEndpoint = 'api/scheduledSms/send'

const processNextQueue = async () => {
    const result = await db.getRequests(db.smsTableName)
    try {
        if (result === false) {return}

        const responsePromises = result.rows.map(async row => {
            try {
                const responsePromise = await fetch(`https://${row.host}/${scheduledSmsSendApiEndpoint}`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(row.ids.split(','))
                })
                return responsePromise
            } catch (error) {
                return Promise.resolve({fetchFailed: true, error: error})
            }
            
        })

        const responses = await Promise.all(responsePromises)

        const decodePromises = responses.map(async response => {
            if (!response.fetchFailed) {
                return await response.json()
            } else {
                return Promise.resolve({ok:false, error_code: 500, description: response.error.message})
            }
        })

        const decodedRows = await Promise.all(decodePromises)

        const dbWritePromises = decodedRows.map(async (decoded, index) => {
            const {id, ...row} = result.rows[index]
            if (decoded.success) {
                row.status = 1
            } else {
                row.status = -1
                row.error = JSON.stringify(decoded.error)
            }
            row.update_at = helpers.toSqlDateString(new Date())
            return await db.update(db.smsTableName, id, row)
        })

        await Promise.all(dbWritePromises)
    } catch (error) {
        await helpers.sendErrorToGroup(error)
    }
}

const runClearDBSchedule = async () => {

    const rule = new schedule.RecurrenceRule()
    rule.hour = 0
    rule.minute = 0
    rule.second = 0

    schedule.scheduleJob(rule, async () => {
        try {
            await db.clearDatabase(db.smsTableName)
        } catch (error) {
            console.error('runClearDBSchedule -> catch')
            await helpers.sendErrorToGroup(error)
        }
    })
}

const runScheduleHandler = () => {
    setTimeout(async () => {
        try {
            await processNextQueue()
        } catch (error) {
            await helpers.sendErrorToGroup(error)
        }
        runScheduleHandler()
    }, 30000)
}

module.exports = {runScheduleHandler, runClearDBSchedule}