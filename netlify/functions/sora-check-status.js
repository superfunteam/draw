// Proxy function to check Sora video status (avoids CORS issues)
const https = require('https');

exports.handler = async function(event, context) {
  const videoId = event.queryStringParameters?.videoId;
  
  if (!videoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'videoId is required' })
    };
  }

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: `/v1/videos/${videoId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: data
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      });
    });

    req.end();
  });
};

