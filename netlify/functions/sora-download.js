// Proxy function to download Sora video content (avoids CORS issues)
exports.handler = async function(event, context) {
  const videoId = event.queryStringParameters?.videoId;
  
  if (!videoId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'videoId is required' })
    };
  }

  try {
    const response = await fetch(`https://api.openai.com/v1/videos/${videoId}/content`, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        statusCode: response.status,
        body: errorText
      };
    }

    // Get the video as a buffer
    const videoBuffer = await response.arrayBuffer();
    const base64Video = Buffer.from(videoBuffer).toString('base64');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'video/mp4',
        'Access-Control-Allow-Origin': '*'
      },
      body: base64Video,
      isBase64Encoded: true
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};

