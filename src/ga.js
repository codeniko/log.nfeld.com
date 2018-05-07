const request = require('request')
const querystring = require('querystring')
const uuidv4 = require('uuid/v4')

const GA_ENDPOINT = `https://www.google-analytics.com/collect`

function whitelistDomain(domain, addWww = true) {
  const prefixes = [
    'https://',
    'http://',
  ]
  if (addWww) {
    prefixes.push('https://www.')
    prefixes.push('http://www.')
  }
  prefixes.forEach(prefix => originWhitelist.push(prefix + domain))
}

const originWhitelist = [] // keep this empty and append domains to whitelist using whiteListDomain()
whitelistDomain('nfeld.com')
whitelistDomain('jessicalchang.com')

/* https://developers.google.com/analytics/devguides/collection/protocol/v1/devguide
v: 1
_v: j67
a: 751874410
t: pageview
_s: 1
dl: https://nfeld.com/about.html
dr: https://google.com
ul: en-us
de: UTF-8
dt: Nikolay Feldman - Software Engineer
sd: 24-bit
sr: 1440x900
vp: 945x777
je: 0
_u: blabla~
jid: 
gjid: 
cid: 1837873423.1522911810
tid: UA-116530991-1
_gid: 1828045325.1524815793
gtm: u4d
z: 1379041260
*/

function proxyToGoogleAnalytics(event, done) {
  // get GA params whether GET or POST request
  const params = event.httpMethod.toUpperCase() === 'GET' ? event.queryStringParameters : JSON.parse(event.body)
  const headers = event.headers || {}

  // attach other GA params, required for IP address. UA and CID can be sent from client
  params.uip = headers['x-forwarded-for'] || headers['x-bb-ip'] || '' // ip override
  params.ua = params.ua || headers['user-agent'] || '' // user agent override
  params.cid = params.cid || uuidv4() // REQUIRED: use given cid, or generate a new one as last resort. Generating should be avoided because the one user will show up in GA multiple times. If user refresh page `n` times, you'll get `n` pageviews logged into GA from "different" users. Client should generate a uuid and store in cookies, local storage, or generate a fingerprint

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
  console.info('is whitelisted?', isOriginWhitelisted)

  const headers = {
    'Access-Control-Allow-Origin': isOriginWhitelisted ? origin : originWhitelist[0],
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept',
  }

  const done = () => {
    callback(null, {
      statusCode: 200,
      headers,
      body: '',
    })
  }

  const httpMethod = event.httpMethod.toUpperCase()

  if (event.httpMethod === 'OPTIONS') {
    done()
  } else if (httpMethod === 'GET' || httpMethod === 'POST') {
    proxyToGoogleAnalytics(event, done)
  } else {
    callback('Not found')
  }
}
