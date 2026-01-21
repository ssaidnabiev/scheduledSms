const pool = require('./pool');
const helpers = require('./helpers.js')

const smsTableName = 'sms'

// async function newPgClient() {
//     const pgClient = new pg.Client(pgDbDetails)
//     pgClient.on('error', async error => {
//         await helpers.sendErrorToGroup(error)
//         await pgClient.end()
//     })
//     await pgClient.connect()
//     return pgClient
// }

async function add(tableName, newRow) {
    // const pgClient = await newPgClient()
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
        await pool.query({text: text, values: values})
        // await pgClient.query({text: text, values: values})
    } catch (error) {
        await helpers.sendErrorToGroup(error)
    }
    // await pgClient.end()
}

async function update(tableName, id, newRow) {
    // const pgClient = await newPgClient()

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
        await pool.query({text: text, values: values})
    } catch (error) {
        await helpers.sendErrorToGroup(error)
    }
    
    // await pgClient.end()
}

async function getRequests(tableName) {
    // const pgClient = await newPgClient()
    const currentTimestamp = Date.now()
    const sql =
        `select 
            r.*
        from ${tableName} r
        where r.time < ${currentTimestamp}`
    
    try {
        const result = await pool.query(sql)
        // await pgClient.end()
        return result
    } catch (error) {
        await helpers.sendErrorToGroup(error)
        // await pgClient.end()
        return false
    }
}

async function clearDatabase(tableName) {
    // const pgClient = await newPgClient()
    try {
        const currentTimestamp = Date.now()
        const sql = `delete from ${tableName} where time < ${currentTimestamp}`
        await pool.query(sql)
    } catch (error) {
        await helpers.sendErrorToGroup(error)
    }
    
    // await pgClient.end()
}


module.exports = {newPgClient, add, update, smsTableName, getRequests, clearDatabase}