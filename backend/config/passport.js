const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const crypto = require('crypto');
const User = require('../models/User');

// ============================================================
// PASSPORT CONFIG
// Purpose: Configure Google OAuth strategy for authentication
// Used by: server.js (passport.initialize()), auth.routes.js (passport.authenticate)
// Flow: Google redirects back with profile → find or create user → return user to callback
// Note: Session support is disabled (session: false) — we use JWT instead
// ============================================================

passport.use(
    new GoogleStrategy(
        // ----------------------------------------
        // Strategy Options
        // Purpose: Tell Passport how to talk to Google
        // ----------------------------------------
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,

            // Request Drive read access in addition to profile and email
            // drive.readonly — list and read files, no write access
            scope: ['profile', 'email', 'https://www.googleapis.com/auth/drive.readonly'],

            // Force Google to return a refresh token every time
            // Without these, Google only issues a refresh token on the first ever authorization
            accessType: 'offline',
            prompt: 'consent',
        },

        // ----------------------------------------
        // Verify Callback
        // Purpose: Runs after Google redirects back — find or create the user
        // Params: accessToken, refreshToken (Google tokens), profile (Google user data), done (Passport callback)
        // ----------------------------------------
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const googleId = profile.id;

                // Case 1: User already linked this Google account — just log them in
                let user = await User.findOne({ googleId });
                if (user) {
                    // Refresh tokens in case they rotated
                    user.googleAccessToken = accessToken;
                    user.googleRefreshToken = refreshToken || user.googleRefreshToken;
                    user.googleTokenExpiry = new Date(Date.now() + 3600 * 1000); // ~1hr estimate
                    // Google has already verified this email address
                    user.emailVerified = true;
                    await user.save();
                    return done(null, user);
                }

                // Case 2: User exists by email but hasn't linked Google yet — link the accounts
                user = await User.findOne({ email });
                if (user) {
                    user.googleId = googleId;
                    user.googleAccessToken = accessToken;
                    user.googleRefreshToken = refreshToken;
                    user.googleTokenExpiry = new Date(Date.now() + 3600 * 1000);
                    // Google has already verified this email address
                    user.emailVerified = true;
                    await user.save();
                    return done(null, user);
                }

                // Case 3: Brand new user — create account from Google profile
                // username derived from email prefix (e.g. john.doe@gmail.com → john.doe)
                let username = email.split('@')[0];
                const existingUsername = await User.findOne({ username });
                if (existingUsername) {
                    username = `${username}_${crypto.randomBytes(3).toString('hex')}`;
                }

                try {
                    user = await User.create({
                        email,
                        username,
                        firstName: profile.name.givenName,
                        lastName: profile.name.familyName,
                        googleId,
                        googleAccessToken: accessToken,
                        googleRefreshToken: refreshToken,
                        googleTokenExpiry: new Date(Date.now() + 3600 * 1000),
                        // Google has already verified this email address
                        emailVerified: true,
                    });
                } catch (createErr) {
                    return done(createErr, null);
                }

                return done(null, user);
            } catch (err) {
                return done(err, null);
            }
        }
    )
);

module.exports = passport;
