// Returns a 'YYYY-MM-DD HH:MM:SS' string in UTC, so timestamps are consistent
// regardless of the server's local timezone.
function toSqlDateString(date) {
    const year = date.getUTCFullYear()
    const month = date.getUTCMonth() + 1
    const day = date.getUTCDate()

    const hour = date.getUTCHours()
    const minute = date.getUTCMinutes()
    const second = date.getUTCSeconds()

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