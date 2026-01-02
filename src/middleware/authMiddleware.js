import jwt from "jsonwebtoken";

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.sendStatus(401).json({
      error: "MissingAuthHeader",
      message: "Authorization header is required",
    });
  }

  const [scheme, tokenValue] = authHeader.split(" ");
  const token = scheme?.toLowerCase() === "bearer" ? tokenValue : authHeader;

  if (!token) {
    return res.sendStatus(401).json({
      error: "MissingToken",
      message: "Bearer token is missing from Authorization header",
    });
  }

  if (!process.env.ACCESS_TOKEN_SECRET) {
    console.error("JWT secrets missing");
    return res.status(500).json({
      error: "ServerMisconfigured",
      message: "Authentication service is not configured"
    });
  }
  
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          error: "TokenExpired",
          message: "Your session has expired. Please log in again.",
        });
      }

      if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
          error: "InvalidToken",
          message: "The provided authentication token is invalid",
        });
      }

      return res.status(401).json({
        error: "TokenVerificationFailed",
        message: "Failed to verify authentication token",
      });
    }

    if (!decoded?.id) {
      return res.status(401).json({
        error: "MalformedToken",
        message: "Authentication token does not contain a user id",
      });
    }

    req.user = decoded;
    req.userId = decoded.id;
    next();
  });
}

export default authMiddleware;
