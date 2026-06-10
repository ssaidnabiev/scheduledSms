const db = require('./db.js')
const helpers = require('./helpers.js')
const info = require('./info.js')
const schedule = require('node-schedule')
const scheduledSmsSendApiEndpoint = 'api/scheduledSms/send'

const processNextQueue = async () => {
    const result = await db.getRequests(db.smsTableName)
    try {
        if (result === false) {return}

        // getRequests already filters to due (time < now) and pending (status = 0) rows
        const responsePromises = result.rows.map(async row => {
            try {
                const responsePromise = await fetch(`https://${row.host}/${scheduledSmsSendApiEndpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Internal-Token': info.internalSmsToken
                    },
                    body: JSON.stringify({ids: row.ids.split(',')}),
                    signal: AbortSignal.timeout(15000)
                })
                return responsePromise
            } catch (error) {
                // "fetch failed" is generic; the real reason (DNS/conn/TLS/timeout)
                // lives in error.cause — capture it so the row's error is diagnosable
                const cause = error.cause ? (error.cause.code || error.cause.message || String(error.cause)) : ''
                const message = cause ? `${error.message}: ${cause}` : error.message
                return Promise.resolve({fetchFailed: true, error: message})
            }

        })

        const responses = await Promise.all(responsePromises)

        const decodePromises = responses.map(async response => {
            if (!response.fetchFailed) {
                return await response.json()
            } else {
                return Promise.resolve({success: false, error: response.error})
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
    }, 10000)
}

module.exports = {runScheduleHandler, runClearDBSchedule}