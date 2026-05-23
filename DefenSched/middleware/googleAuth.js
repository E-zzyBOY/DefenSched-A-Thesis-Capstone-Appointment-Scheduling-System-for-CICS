'use strict';

const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const db = require('../database');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`
},
  (accessToken, refreshToken, profile, done) => {
    const email = profile.emails?.[0]?.value?.toLowerCase();

    // Block non-IE emails just in case
    if (!email || !email.endsWith('@cics.edu.ph')) {
      return done(null, false, { message: 'Only @cics.edu.ph accounts are allowed.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1').get(email);

    if (!user) {
      return done(null, false, { message: 'No account found. Please register first.' });
    }

    if (user.status === 'pending') {
      return done(null, false, { message: 'Your account is pending admin approval.' });
    }

    if (user.status !== 'active') {
      return done(null, false, { message: 'Your account is not active.' });
    }

    return done(null, user);
  }));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  done(null, user || false);
});