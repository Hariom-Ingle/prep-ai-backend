import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });

  res.cookie('jwt', token, {
    httpOnly: true, // Prevents client-side JS from accessing the cookie
    // secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    secure:  false, // HTTPS only in production
    // sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax', // 'None' allows cross-site cookies
    sameSite: 'lax', // 'None' allows cross-site cookies
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds (same as token expiry)
  });

  

  return token;
};

export default generateToken;
