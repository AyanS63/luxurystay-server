import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Access Denied: No token provided' });
  }

  try {
    // Remove "Bearer " if present
    const tokenString = token.startsWith('Bearer ') ? token.slice(7, token.length) : token;
    
    const verified = jwt.verify(tokenString, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

export const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
       return res.status(401).json({ message: 'Access Denied' });
    }

    if (!roles.includes(req.user.role)) {
       return res.status(403).json({ message: 'Access Denied: You do not have permission' });
    }
    next();
  };
};
