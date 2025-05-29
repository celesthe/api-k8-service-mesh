const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
const client = require('prom-client');
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const counter = new client.Counter({
  name: 'http_requests_total',
  help: 'Número total de solicitudes HTTP a /ping'
});

const responseTime = new client.Histogram({
  name: 'http_response_duration_seconds',
  help: 'Duración de respuestas HTTP',
  buckets: [0.1, 0.5, 1, 1.5]
});

const errorCounter = new client.Counter({
  name: 'http_errors_total',
  help: 'Total de errores 5xx'
});


app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});


app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/ping', (req, res) => {
  counter.inc(); // incrementa en 1
  res.json({ message: 'pong' });
});

app.get('/ping', (req, res) => {
  const end = responseTime.startTimer();
  // lógica de la respuesta...
  res.json({ message: 'pong' });
  end(); // marca el tiempo
});

app.get('/error', (req, res) => {
  errorCounter.inc();
  res.status(500).send('Error simulado');
});

//add a post endpoint called Service2 that make a request to another service
app.post('/Service', async (req, res) => {
  try {
    // Simula una llamada a otro servicio
    const nameurl = req.body.name || 'World';
    const portUrl = req.body.port || '80';
    const response = await fetch(`http://${nameurl}:${portUrl}/HelloService`);
    if (!response.ok) {
      throw new Error('Error al llamar al servicio externo');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    errorCounter.inc();
    res.status(500).send('Error al llamar al servicio externo');
  }
});


//add a service called HelloService 
app.get('/HelloService', (req, res) => {
  res.json({ message: 'Hello from HelloService!' });
});


app.listen(port, () => {
  console.log(`API corriendo en http://localhost:${port}`);
});
