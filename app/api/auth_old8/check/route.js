// app/api/auth/check/route.js
export async function GET(req) {
  // Get cookies from headers
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => c.trim().split('='))
  );
  
  const token = cookies.token;

  if (!token) {
    return Response.json({ loggedIn: false }, { status: 200 });
  }

  try {
    // Implement your token verification logic
    const decoded = verifyToken(token);
    return Response.json({ 
      loggedIn: true,
      user: decoded // optional
    }, { status: 200 });

  } catch (error) {
    return Response.json({ loggedIn: false }, { status: 200 });
  }
}

// Simple JWT verification example (implement properly)
function verifyToken(token) {
  const jwt = require('jsonwebtoken');
  return jwt.verify(token, process.env.JWT_SECRET);
}