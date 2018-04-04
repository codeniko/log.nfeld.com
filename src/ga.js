const request = require('request')
const querystring = require('querystring')
const uuidv4 = require('uuid/v4')

const GA_ENDPOINT = `https://www.google-analytics.com/collect`

const originWhitelist = [] // keep this empty and append domains to whitelist using whiteListDomain()
whitelistDomain('nfeld.com')
whitelistDomain('jessicalchang.com')

function whitelistDomain(domain, addWww = true) {
  const prefixes = [
    'https://',
    'http://',
  ]
  if (addWww) {
    prefixes.push('https://www')
    prefixes.push('http://www')
  }
  prefixes.forEach(prefix => originWhitelist.push(prefix + domain))
}


// https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide
function proxyToGoogleAnalytics(event, done) {
  const params = event.queryStringParameters
  const headers = event.headers || {}
  params.ua = headers['user-agent'] || '' // user agent override
  params.uip = headers['x-forwarded-for'] || headers['x-bb-ip'] || '' // ip override
  params.cid = params.cid || uuidv4() // use given cid, or generate a new one

  console.info('Query params:', params)
  const qs = querystring.stringify(params)

  const reqOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'image/gif',
    },
    url: GA_ENDPOINT,
    body: qs,
  }

  request(reqOptions, (error, result) => {
    if (error) {
      console.info('ga error!', error)
    } else {
      console.info('ga status code', result.statusCode, result.statusMessage)
    }
  })

  done()
}


exports.handler = function(event, context, callback) {
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  console.log(`Received ${event.httpMethod} request from, origin: ${origin}`)

  const isOriginWhitelisted = originWhitelist.indexOf(origin) >= 0

  const headers = {
    'Access-Control-Allow-Origin': isOriginWhitelisted ? origin : originWhitelist[0],
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept',
  }

  const done = () => {
    callback(null, {
      statusCode: 200,
      headers,
      body: '',
    })
  }

  if (event.httpMethod === 'OPTIONS') {
    done()
  } else if (event.httpMethod !== 'GET') {
    callback({error: 'Not found'})
  } else {
    proxyToGoogleAnalytics(event, done)
  }
}
