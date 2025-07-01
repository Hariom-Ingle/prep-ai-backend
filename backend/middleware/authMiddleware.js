import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

 
    // 2. If not in header, extract from cookies
    if (!token && req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, token missing' });
    }

    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
 

    // 4. Attach user data
    req.userId = decoded.id;
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({ message: 'User not found' });
    }

    next();
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

export { protect };
