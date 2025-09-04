const http = require('http');  // import http module

// Create server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' }); // set response header
  res.end('Hello World!\n'); // send response
});

// Start server
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000/');
});
