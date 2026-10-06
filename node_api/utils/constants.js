const httpCookieOptions = {
    httpOnly: true,
    secure: true,
    // sameSite: 'strict', // Optional: This adds an extra layer of security
    // maxAge: 24 * 60 * 60 * 1000, // Optional: Set cookie expiration time (e.g., 1 day)
};

module.exports = {
    httpCookieOptions,
};
