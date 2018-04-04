const request = require('request')

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

const originWhitelist = [] // keep this empty and append domains to whitelist using whiteListDomain()
whitelistDomain('nfeld.com')

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
    prefixes.push('https://www')
    prefixes.push('http://www')
  }
  prefixes.forEach(prefix => originWhitelist.push(prefix + domain))
}


function beacon(event, context, callback, headers) {
  const { domain } = event.queryStringParameters
  console.info('POST payload:', event.body)

  const reqOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    json: true,
    url: logEndpoint(domainTagMap[domain]),
    body: JSON.parse(event.body),
  }

  return promisedRequest(reqOptions)
    .then(result => {
      console.info('result from loggly:', result.body)
      callback(null, {
        statusCode: 200,
        headers,
        body: '{"success":true}'
      })
    })
}


exports.handler = function(event, context, callback) {
  console.log('event obj', event)
  console.log('context obj', context)
  const origin = event.headers['origin'] || event.headers['Origin'] || ''
  console.log(`Received ${event.httpMethod} request from, origin: ${origin}`)

  const isOriginWhitelisted = originWhitelist.indexOf(origin) >= 0

  const headers = {
    'Access-Control-Allow-Origin': isOriginWhitelisted ? origin : originWhitelist[0],
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Accept',
  }

  if (event.httpMethod === 'OPTIONS') {
    callback(null, {
      statusCode: 200,
      headers,
      body: '',
    })
  } else if (event.httpMethod !== 'POST') {
    callback({error: 'Not found'})
  } else {
    headers['Content-Type'] = 'application/json'
    return beacon(event, context, callback, headers)
      .catch((error) => {
        console.log({error})
        callback({error})
      })
  }
}
