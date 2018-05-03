const request = require('request')

/*
function promisedRequest(options) {
  return new Promise((resolve, reject) => {
    request(options, (error, response) => {
      if (error) {
        reject(error)
      } else {
        resolve(response)
      }
    })
  })
}
*/

const originWhitelist = [] // keep this empty and append domains to whitelist using whiteListDomain()
whitelistDomain('nfeld.com')
whitelistDomain('jessicalchang.com')

const domainTagMap = {
  'nfeld.com': 'testnfeld',
  'jessicalchang.com': 'testjessica',
}

function logEndpoint(tag) {
  return `http://logs-01.loggly.com/inputs/7c195f80-32e3-4204-8a08-c04d8bd7e08c/tag/${tag}/`
}

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

function track(event, done) {
  const { domain } = event.queryStringParameters
  console.info('tracker payload:', event.body)

  const reqOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    json: true,
    url: logEndpoint(domainTagMap[domain]),
    body: JSON.parse(event.body),
  }

  request(reqOptions, (error, result) => {
    if (error) {
      console.info('loggly error!', error)
    } else {
      console.info('result from loggly:', result.statusCode, result.statusMessage)
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
    //'Access-Control-Allow-Origin': isOriginWhitelisted ? origin : originWhitelist[0],
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
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
  } else if (event.httpMethod !== 'POST') {
    callback('Not found')
  } else {
    track(event, done)
  }
}
