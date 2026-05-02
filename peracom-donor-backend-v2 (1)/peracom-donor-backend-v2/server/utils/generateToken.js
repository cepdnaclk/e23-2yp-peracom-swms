import jwt from 'jsonwebtoken';

export function generateToken(payload) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not set in .env');
  }

  return jwt.sign(
    {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    },
    secret,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not set in .env');
  }

  return jwt.verify(token, secret);
}
