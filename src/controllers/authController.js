import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prismaClient.js";

const missingSecrets = () =>
  !process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET;

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Username and password are required",
    });
  }

  if (missingSecrets()) {
    console.error("JWT secrets missing");
    return res.status(500).json({
      error: "ServerMisconfigured",
      message: "Authentication service is not configured",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    if (!user) {
      return res.status(401).json({
        error: "InvalidCredentials",
        message: "Username or password is incorrect",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        error: "InvalidCredentials",
        message: "Username or password is incorrect",
      });
    }

    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10s" }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken });
  } catch (err) {
    console.error("Login failed:", err);
    res.status(503).json({
      error: "DatabaseError",
      message: "Login service is temporarily unavailable",
    });
  }
};

const register = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: "ValidationError",
      message: "Username and password are required",
    });
  }

  if (missingSecrets()) {
    console.error("JWT secrets missing");
    return res.status(500).json({
      error: "ServerMisconfigured",
      message: "Authentication service is not configured",
    });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    // create a token
    const accessToken = jwt.sign(
      { id: user.id, username: user.username },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "10s" }
    );
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "None" : "Lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({ accessToken });
  } catch (err) {
    console.error("Register failed:", err);

    // If unique constraint on username fails
    if (err.code === "P2002") {
      return res.status(409).json({
        error: "UserExists",
        message: "Username is already taken",
      });
    }

    res.status(503).json({
      error: "DatabaseError",
      message: "Registration service unavailable",
    });
  }
};

const refresh = (req, res) => {
  if (missingSecrets()) {
    return res.status(500).json({
      error: "ServerMisconfigured",
      message: "Authentication service is not configured",
    });
  }
  const refreshToken = req.cookies?.jwt;

  if (!refreshToken) {
    return res.status(401).json({
      error: "NoRefreshToken",
      message: "Login required",
    });
  }

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          error: "InvalidRefreshToken",
          message: "Session expired — please log in again",
        });
      }

      try {
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
        });

        if (!user) {
          return res.status(401).json({
            error: "UserNotFound",
            message: "Account no longer exists",
          });
        }

        const accessToken = jwt.sign(
          { id: user.id, username: user.username },
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "10s" }
        );

        res.json({ accessToken });
      } catch (err) {
        console.error("Refresh failed:", err);

        res.status(503).json({
          error: "DatabaseError",
          message: "Unable to refresh session",
        });
      }
    }
  );
};

const logout = (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  res.clearCookie("jwt", { httpOnly: true, sameSite: "None", secure: true });
  res.json({ message: "Cookie cleared" });
};

export default { login, register, refresh, logout };
