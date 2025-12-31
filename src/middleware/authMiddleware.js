import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return res.sendStatus(401);
    }

    const [scheme, tokenValue] = authHeader.split(' ')
    const token = scheme?.toLowerCase() === 'bearer' ? tokenValue : authHeader

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.sendStatus(401);
        }
        req.user = decoded;
        req.userId = decoded.id;
        next();
    })
}

export default authMiddleware;