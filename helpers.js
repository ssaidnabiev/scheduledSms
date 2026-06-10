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
    console.error('Caught exception:', err.message, origin ? `(origin: ${origin})` : '')
}

module.exports = {toSqlDateString, sendErrorToGroup}