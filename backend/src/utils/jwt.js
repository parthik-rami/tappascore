import crypto from 'crypto';

const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: JWT_SECRET environment variable is missing in production environment!');
  }
  return secret || 'fallback_tappascore_jwt_secret_key_2026';
};

/**
 * Sign payload to create JWT token (valid for exactly 24 hours)
 * @param {object} payload 
 * @returns {string}
 */
export const signJwt = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const claims = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // Exactly 24 hours (86400 seconds)
  };
  const encodedPayload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(`${header}.${encodedPayload}`)
    .digest('base64url');

  return `${header}.${encodedPayload}.${signature}`;
};

/**
 * Verify JWT token and return decoded payload
 * @param {string} token 
 * @returns {object|null}
 */
export const verifyJwt = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', getSecret())
    .update(`${header}.${payload}`)
    .digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && Math.floor(Date.now() / 1000) > decoded.exp) {
      return null; // Expired
    }
    return decoded;
  } catch (err) {
    return null;
  }
};
