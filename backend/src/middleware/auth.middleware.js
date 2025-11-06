const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const { failure } = require("../utils/response.utils");
const { httpsStatusCodes } = require("../constants/httpStatusCodes.constants");
const { serverResponseMessage } = require("../constants/messages.constants");

// Initialize the JWKS client
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  rateLimit: true,
});

const getKey = (header, callback) => {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return failure(
        res,
        httpsStatusCodes.UNAUTHORIZED,
        serverResponseMessage.UNAUTHORIZED_USER
      );
    }

    const accessToken = authHeader.split(" ")[1];

    // First, decode the token without verification to check the issuer
    const decodedToken = jwt.decode(accessToken, { complete: true });
    if (!decodedToken) {
      throw new Error("Invalid token format");
    }

    // Use the actual issuer from the token for verification
    jwt.verify(
      accessToken,
      getKey,
      {
        algorithms: ["RS256"],
        audience: process.env.AUD_KEY,
        issuer: decodedToken.payload.iss,
      },
      (err, decoded) => {
        if (err) {
          return failure(
            res,
            httpsStatusCodes.UNAUTHORIZED,
            serverResponseMessage.UNAUTHORIZED_USER,
            err.message
          );
        }
        next();
      }
    );
  } catch (error) {
    return failure(
      res,
      httpsStatusCodes.UNAUTHORIZED,
      serverResponseMessage.UNAUTHORIZED_USER,
      error.message
    );
  }
};

module.exports = {
  verifyToken,
};
