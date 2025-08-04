const passport = require('passport');
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');
const VA = require('../models/VA');

passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: "/auth/linkedin/callback",
  scope: ['r_liteprofile', 'r_emailaddress'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('LinkedIn OAuth Profile:', profile);

    // Check if user already exists with LinkedIn ID
    let existingUser = await User.findOne({ linkedinId: profile.id });
    
    if (existingUser) {
      // User already exists, load their complete profile
      await existingUser.populate(['va', 'business']);
      return done(null, existingUser);
    }

    // Check if user exists with same email
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    if (email) {
      existingUser = await User.findOne({ email: email });
      if (existingUser) {
        // Link LinkedIn account to existing user
        existingUser.linkedinId = profile.id;
        existingUser.linkedinProfile = {
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profileUrl: profile.profileUrl,
          pictureUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
        };
        await existingUser.save();
        await existingUser.populate(['va', 'business']);
        return done(null, existingUser);
      }
    }

    // Create new user with LinkedIn data
    const newUser = await User.create({
      email: email,
      linkedinId: profile.id,
      linkedinProfile: {
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        profileUrl: profile.profileUrl,
        pictureUrl: profile.photos && profile.photos[0] ? profile.photos[0].value : null
      },
      emailVerified: true, // LinkedIn emails are verified
    });

    // Create a basic VA profile with LinkedIn data
    const va = await VA.create({
      user: newUser._id,
      name: `${profile.name.givenName} ${profile.name.familyName}`,
      bio: 'Professional virtual assistant',
      searchStatus: 'open',
      // Add LinkedIn profile picture if available
      ...(profile.photos && profile.photos[0] && {
        avatar: profile.photos[0].value
      })
    });

    // Link VA profile to user
    newUser.va = va._id;
    await newUser.save();
    await newUser.populate(['va', 'business']);

    return done(null, newUser);
  } catch (error) {
    console.error('LinkedIn OAuth Error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).populate(['va', 'business']);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;