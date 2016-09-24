const DAY    = require('constants/day')
const MONTH  = require('constants/month')

let language = require('language')
let jsUtil   = require('utils/js')



////////////
// CREATE //
////////////



/**
 * Creates a date object using a certain value.
 * @param  {Date|Number} value
 * @return {Date}
 */
function create(value) {

  if (Number.isInteger(value)) {
    return new Date(value)
  }

  return value

}



/**
 * Creates a date clamped in a month.
 * @param  {Number} year
 * @param  {Number} month
 * @param  {Number} date
 * @return {Date}
 */
function createInMonth(year, month, date) {

  // Create a date object from the original values
  let dateObject = new Date(year, month, date)

  // Normalize the month to be clamped within 0 and 11
  month = (month + 12) % 12

  // Until the target date's month isn't the normalized
  // month, keep reducing the date by 1
  while (dateObject.getMonth() !== month) {
    date -= 1
    dateObject = new Date(year, month, date)
  }

  return dateObject

}





////////////////////
// FORMAT & PARSE //
////////////////////



/**
 * A mapping of template hooks to formatters.
 * FIXME: Use moment.js formats: http://momentjs.com/docs/#/parsing/string-format/
 * @private
 * @type {Object(Function)}
 */
const HOOK_FORMATTER = {
  d    : dateObject => `${dateObject.getDate()}`,
  dd   : dateObject => `${jsUtil.padZero(HOOK_FORMATTER.d(dateObject), 2)}`,
  ddd  : dateObject => getShortDayName(dateObject.getDay()),
  dddd : dateObject => getFullDayName(dateObject.getDay()),
  m    : dateObject => `${dateObject.getMonth() + 1}`,
  mm   : dateObject => `${jsUtil.padZero(HOOK_FORMATTER.m(dateObject), 2)}`,
  mmm  : dateObject => getShortMonthName(dateObject.getMonth()),
  mmmm : dateObject => getFullMonthName(dateObject.getMonth()),
  yyyy : dateObject => `${dateObject.getFullYear()}`,
}



/**
 * A mapping of template hooks to parsers.
 * @private
 * @type {Object(Function)}
 */
const HOOK_PARSER = {
  d    : getStartingDigits,
  dd   : getStartingDigits,
  ddd  : getStartingWord,
  dddd : getStartingWord,
  m    : getStartingDigits,
  mm   : getStartingDigits,
  mmm  : getStartingWord,
  mmmm : getStartingWord,
  yyyy : getStartingDigits,
}



/**
 * A collection of the template hooks.
 * @private
 * @type {String[]}
 */
const HOOKS = Object.keys(HOOK_FORMATTER)



/**
 * A regular expression that matches all segments of a template string.
 * @private
 * @type {RegExp}
 */
const HOOKS_REGEXP = new RegExp([

  // Match any characters escaped with square brackets
  '(\\[.*?\\])',

  // Match any template hooks
  `(?:\\b(${HOOKS.join('|')})\\b)`,

  // Match all other characters
  '(.)',

].join('|'), 'g')



/**
 * Gets the starting word from a string.
 * @private
 * @param  {String} string
 * @return {String}
 */
function getStartingWord(string) {
  return string.replace(/(^\w*)(.*)/, '$1')
}



/**
 * Gets the starting digits from a string.
 * @private
 * @param  {String} string
 * @return {String}
 */
function getStartingDigits(string) {
  return string.replace(/(^\d*)(.*)/, '$1')
}



/**
 * Matches the hooks of a template.
 * @private
 * @param  {String} template
 * @return {Object[]}
 */
function matchHooks(template) {
  return (
    template

      // Split the template using the regular expression
      .split(HOOKS_REGEXP)

      // Map the chunks to keep a reference of their match group index
      .map((chunk, index) => ({ chunk, index: index % 4 }))

      // Filter out false-y chunks
      .filter(match => !!match.chunk)

  )
}



/**
 * Gets the date units (date, month, & year) from a hook value map.
 * @private
 * @param  {Object<String>} hookValue
 * @return {Object}
 */
function getDateUnitsFromHookValue(hookValue) {

  // Grab the year and date from the hook values
  let year  = hookValue.yyyy
  let date  = hookValue.dd || hookValue.d

  // Grab the index of the month name or the hook value
  let month = (
    hookValue.mmmm ? getIndexOfFullMonthName(hookValue.mmmm) :
    hookValue.mmm ? getIndexOfShortMonthName(hookValue.mmm) :
    (hookValue.mm || hookValue.m) - 1
  )

  return { date, month, year }

}



/**
 * Checks if a parsed date unit is a valid date unit.
 * @private
 * @param  {String|null}  dateUnit
 * @return {Boolean}
 */
function isValidParsedDateUnit(dateUnit) {
  return dateUnit != null && /^\d+$/.test(dateUnit)
}



/**
 * Checks if all parsed date units are valid date units.
 * @private
 * @param  {...(String|null)} dateUnits
 * @return {Boolean}
 */
function areValidParsedDateUnits(...dateUnits) {
  return dateUnits.every(isValidParsedDateUnit)
}



/**
 * Formats a date object with a given template.
 * @param  {Date} dateObject
 * @param  {String} template
 * @return {String}
 */
function format(dateObject, template) {

  dateObject = create(dateObject)

  return (

    // Match hooks within the template
    matchHooks(template)

      // Map through the matches while formatting template hooks
      // and removing the hooks of escaped characters
      .map(match => (
        match.index === 2 ? HOOK_FORMATTER[match.chunk](dateObject) :
        match.index === 1 ? match.chunk.replace(/^\[(.*)]$/, '$1') :
        match.chunk
      ))

      // Join the chunks together into a string
      .join('')

  )

}



/**
 * Parses a date string with a given template.
 * @param  {String} dateString
 * @param  {String} template
 * @return {Date|null}
 */
function parse(dateString, template) {

  // Keep a reference to the original date string
  let originalDateString = dateString

  // Create a mapping of hook to the parsing value
  let hookValue = {}

  // Match hooks within the template and iterate over it
  matchHooks(template).some(match => {

    // Grab the string to strip off of the date string
    let stringToStrip = match.chunk

    // If the match is a template hook, parse it to get
    // the actual string to strip
    if (match.index === 2) {
      stringToStrip = HOOK_PARSER[stringToStrip](dateString)
      hookValue[match.chunk] = stringToStrip
    }

    // Otherwise if the characters were escaped,
    // remove the hooks of escaped characters
    else if (match.index === 1) {
      stringToStrip = stringToStrip.replace(/^\[(.*)]$/, '$1')
    }

    // Grab the length of the string to strip
    let lengthToStrip = stringToStrip.length

    // If there is no length to strip,
    // or the string to strip does not match the starting
    // of the date string, log an error and stop parsing
    if (
      !lengthToStrip
      ||
      stringToStrip !== dateString.substring(0, lengthToStrip)
    ) {
      console.error(
        'Unable to parse the date %o. Expected to match %o at position %o',
        originalDateString,
        match.chunk,
        originalDateString.length - dateString.length
      )
      return true
    }

    // Otherwise, strip the string from the date string
    // and continue iterating over the matches
    dateString = dateString.slice(lengthToStrip)

  })

  // Get the date units from the hook value
  let { date, month, year } = getDateUnitsFromHookValue(hookValue)

  // If date units are not found, return `null`
  if (!areValidParsedDateUnits(date, month, year)) {
    return null
  }

  // Otherwise, create a date the date
  return new Date(year, month, date)

}





////////////////////
// MONTHS GETTERS //
////////////////////



/**
 * Gets a list of the full month names.
 * @return {String[]}
 */
function getFullMonthNames() {
  return getLanguageValues(MONTH.FULL)
}



/**
 * Gets a list of the short month names.
 * @return {String[]}
 */
function getShortMonthNames() {
  return getLanguageValues(MONTH.SHORT)
}



/**
 * Gets the full name of a specific month.
 * @param  {Number} month
 * @return {String}
 */
function getFullMonthName(month) {
  return getLanguageValue(MONTH.FULL, month)
}



/**
 * Gets the short name of a specific month.
 * @param  {Number} month
 * @return {String}
 */
function getShortMonthName(month) {
  return getLanguageValue(MONTH.SHORT, month)
}



/**
 * Gets the index of a month by it's full name.
 * @private
 * @param  {String} fullMonthName
 * @return {Number}
 */
function getIndexOfFullMonthName(fullMonthName) {
  return MONTH.FULL[language.current].indexOf(fullMonthName)
}



/**
 * Gets the index of a month by it's short name.
 * @private
 * @param  {String} shortMonthName
 * @return {Number}
 */
function getIndexOfShortMonthName(shortMonthName) {
  return MONTH.SHORT[language.current].indexOf(shortMonthName)
}





//////////////////
// DAYS GETTERS //
//////////////////



/**
 * Gets a list of the full day names.
 * @return {String[]}
 */
function getFullDayNames() {
  return getLanguageValues(DAY.FULL)
}



/**
 * Gets a list of the short day names.
 * @return {String[]}
 */
function getShortDayNames() {
  return getLanguageValues(DAY.SHORT)
}



/**
 * Gets the full name of a specific day.
 * @param  {Number} day
 * @return {String}
 */
function getFullDayName(day) {
  return getLanguageValue(DAY.FULL, day)
}



/**
 * Gets the short name of a specific day.
 * @param  {Number} day
 * @return {String}
 */
function getShortDayName(day) {
  return getLanguageValue(DAY.SHORT, day)
}





//////////////
// CHECKERS //
//////////////



/**
 * Checks if two dates fall on the same date.
 * @param  {Date}  one
 * @param  {Date}  two
 * @return {Boolean}
 */
function isSameDate(one, two) {

  one = create(one)
  two = create(two)

  return (
    isSameMonth(one, two) &&
    one.getDate() === two.getDate()
  )

}



/**
 * Checks if two dates fall on the same month.
 * @param  {Date}  one
 * @param  {Date}  two
 * @return {Boolean}
 */
function isSameMonth(one, two) {

  one = create(one)
  two = create(two)

  return (
    isSameYear(one, two) &&
    one.getMonth() === two.getMonth()
  )

}



/**
 * Checks if two dates fall on the same year.
 * @param  {Date}  one
 * @param  {Date}  two
 * @return {Boolean}
 */
function isSameYear(one, two) {

  one = create(one)
  two = create(two)

  return (
    one instanceof Date &&
    two instanceof Date &&
    one.getFullYear() === two.getFullYear()
  )

}





/////////////
// HELPERS //
/////////////



/**
 * Gets the values for a language.
 *
 * @private
 *
 * @param  {Object} languagesValues
 * @return {Object}
 */
function getLanguageValues(languagesValues) {
  let languageValues = languagesValues[language.current]
  return Object.keys(languageValues).map(key => languageValues[key])
}



/**
 * Gets the value for a language by key.
 *
 * @private
 *
 * @param  {Object} languagesValues
 * @param  {String} key
 * @return {String}
 */
function getLanguageValue(languagesValues, key) {
  return languagesValues[language.current][key]
}





/////////////
// EXPORTS //
/////////////



module.exports = {

  // Create
  create,
  createInMonth,

  // Format & parse
  format,
  parse,

  // Months getters
  getFullMonthName,
  getFullMonthNames,
  getShortMonthName,
  getShortMonthNames,

  // Days getters
  getFullDayName,
  getFullDayNames,
  getShortDayName,
  getShortDayNames,

  // Checkers
  isSameDate,
  isSameMonth,
  isSameYear,

}