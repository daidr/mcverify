export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  session: {
    secret: process.env.SESSION_SECRET,
    salt: process.env.SESSION_SALT,
  },
  hduhelp: {
    entry: process.env.HDUHELP_ENTRY,
    client_id: process.env.HDUHELP_CLIENT_ID,
    client_secret: process.env.HDUHELP_CLIENT_SECRET,
    redirect_uri: process.env.HDUHELP_REDIRECT_URI,
  },
});
