// Proxy function to download Sora video content (avoids CORS issues)
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
      path: `/v1/videos/${videoId}/content`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API}`
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => {
        chunks.push(chunk);
      });

      res.on('end', () => {
        if (res.statusCode !== 200) {
          resolve({
            statusCode: res.statusCode,
            body: JSON.stringify({ error: `Failed to download video: ${res.statusCode}` })
          });
          return;
        }

        const videoBuffer = Buffer.concat(chunks);
        const base64Video = videoBuffer.toString('base64');

        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': 'video/mp4',
            'Access-Control-Allow-Origin': '*'
          },
          body: base64Video,
          isBase64Encoded: true
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

