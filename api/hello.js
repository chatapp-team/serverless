export default function handler(request, response) {
  // 1. Set CORS headers to allow DartPad to call this
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Handle the "Preflight" request (OPTIONS)
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // 3. Your original logic
  if (request.method === 'POST') {
    const { name = 'Stranger' } = request.body;
    return response.status(200).json({
      message: `hello ${name}`,
      status: 'success'
    });
  } else {
    return response.status(405).send('Method Not Allowed');
  }
}
