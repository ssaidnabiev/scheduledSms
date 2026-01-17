const os = require('os')
const info = require('./info.js')

function toSqlDateString(date) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    const fHour = hour >= 10 ? hour : `0${hour}`
    const fMinute = minute >= 10 ? minute : `0${minute}`
    const fSecond = second >= 10 ? second : `0${second}`
    const fDay = day >= 10 ? day : `0${day}`
    const fMonth = month >= 10 ? month : `0${month}`

    return `${year}-${fMonth}-${fDay} ${fHour}:${fMinute}:${fSecond}`
}

async function sendErrorToGroup(err, origin='') {
    let error2 = null
    try {
        const apiUrl = `https://api.telegram.org/bot${info.tgBotToken}/`
        const groupID = info.tgGroupChatId
        
        const resp = await fetch(`${apiUrl}sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: groupID,
                text:
                    `<b>${String(os.hostname())}</b>\nCaught exception: ${err.message}\nException origin: ${origin}`,
                parse_mode: 'HTML' 
            })
        })
    } catch (error) {
        try {
            const apiUrl = `https://api.telegram.org/bot${info.tgBotToken}/`
            const chatID = info.tgFallbackChatId
            
            const resp = await fetch(`${apiUrl}sendMessage`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    chat_id: chatID,
                    text: 
                        `<b>${String(os.hostname())}</b>\nCaught exception: ${err.message}\nException origin: ${origin}`,
                    parse_mode: 'HTML' 
                })
            })
        } catch (errorInner) {
            error2 = errorInner
        }
    } finally {
        console.error(error2)
    }
}

module.exports = {toSqlDateString, sendErrorToGroup}