exports.handler = function(event, context, callback) {
  const headers = {}
  headers['Access-Control-Allow-Origin'] = 'https://www.nfeld.com'
  headers['Access-Control-Allow-Methods'] = 'GET'
  headers['Access-Control-Allow-Headers'] = 'Content-Type,Accept'

  callback(null, {
    statusCode: 200,
    headers,
    body: "{success: true}"
  })
  /*
  callback(null, {
    statusCode: 200,
    body: "Hello, World"
  })
  */
}
