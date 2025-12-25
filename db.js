const pg = require('pg')
const helpers = require('./helpers.js')

const pgDbDetails = {
    user: 'postgres',
    host: 'localhost',
    database: 'scheduled_sms',
    password: 'M9[eL4*Bd%G`Q~~q',
    port: 5432
}

const smsTableName = 'sms'

async function newPgClient() {
    const pgClient = new pg.Client(pgDbDetails)
    pgClient.on('error', async error => {
        await helpers.sendErrorToGroup(error)
        await pgClient.end()
    })
    await pgClient.connect()
    return pgClient
}

async function add(tableName, newRow) {
    const pgClient = await newPgClient()
    try {
        const values = []
        const text = `insert into ${tableName}(${
            Object.keys(newRow).map(key => {
                values.push(newRow[key])
                return `${key}`
            }).join(',')
        }) values (${
            values.map ((val, index) => {
                return `$${index + 1}`
            }).join(',')
        })`
        await pgClient.query({text: text, values: values})
    } catch (error) {
        await helpers.sendErrorToGroup(error)
    }
    await pgClient.end()
}

async function update(tableName, id, newRow) {
    const pgClient = await newPgClient()

    let colCount = 1
    const values = [id]
    const text = `update ${tableName} set ${
        Object.keys(newRow).map(key => {
            colCount++
            values.push(newRow[key])
            return `${key}=$${colCount}`
        }).join(',')
    } where id=$1`

    try {
        await pgClient.query({text: text, values: values})
    } catch (error) {
        await helpers.sendErrorToGroup(error)
    }
    
    await pgClient.end()
}

async function getRequests(tableName) {
    const pgClient = await newPgClient()
    const currentTimestamp = Date.now()
    const sql =
        `select 
            r.*
        from ${tableName} r
        where r.time < ${currentTimestamp}`
    
    try {
        const result = await pgClient.query(sql)
        await pgClient.end()
        return result
    } catch (error) {
        await helpers.sendErrorToGroup(error)
        await pgClient.end()
        return false
    }
}

async function clearDatabase(tableName) {
    const pgClient = await newPgClient()
    try {
        const currentTimestamp = Date.now()
        const sql = `delete from ${tableName} where time < ${currentTimestamp}`
        await pgClient.query(sql)
    } catch (error) {
        await helpers.sendErrorToGroup(error)
    }
    
    await pgClient.end()
}


module.exports = {newPgClient, add, update, smsTableName, getRequests, clearDatabase}