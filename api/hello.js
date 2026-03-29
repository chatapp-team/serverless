export default function handler(request, response) {
  // If ?name=xyz is in the URL, request.query.name will be "xyz"
  const { name = 'Stranger' } = request.query; 
  
  response.status(200).send(`hello ${name}`);
}
