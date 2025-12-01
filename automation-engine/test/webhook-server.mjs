/**
 * Simple webhook server to receive Apollo phone number callbacks
 *
 * Run this first: node test/webhook-server.mjs
 * Then use: http://localhost:3333/apollo/webhook as webhook URL
 */

import http from 'http';

const PORT = 3333;
const receivedWebhooks = [];

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/apollo/webhook') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      const timestamp = new Date().toISOString();
      const webhook = {
        timestamp,
        body: body ? JSON.parse(body) : null,
        headers: req.headers
      };

      receivedWebhooks.push(webhook);

      console.log('\n📨 Webhook Received!');
      console.log('   Time:', timestamp);
      console.log('   Body:', JSON.stringify(webhook.body, null, 2));
      console.log('');

      // Respond with 200 OK
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'received' }));
    });
  } else if (req.method === 'GET' && req.url === '/webhooks') {
    // View all received webhooks
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(receivedWebhooks, null, 2));
  } else {
    // Health check
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Apollo Webhook Server Running\n\nPOST to: /apollo/webhook\nGET to: /webhooks (view all)');
  }
});

server.listen(PORT, () => {
  console.log('🚀 Apollo Webhook Server Started\n');
  console.log(`   Listening on: http://localhost:${PORT}`);
  console.log(`   Webhook URL: http://localhost:${PORT}/apollo/webhook`);
  console.log(`   View webhooks: http://localhost:${PORT}/webhooks`);
  console.log('\n   Waiting for Apollo callbacks...\n');
  console.log('   Press Ctrl+C to stop\n');
});
