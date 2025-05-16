require('http').createServer((req, res) => {
  res.end('Hello World from Docker');
}).listen(3000, () => console.log('Server ready on port 3000'));