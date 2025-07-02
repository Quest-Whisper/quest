import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import GoogleProvider from "next-auth/providers/google";
import { getToken } from "next-auth/jwt";


export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive",
            "https://www.googleapis.com/auth/gmail.readonly", // for reading emails
            "https://www.googleapis.com/auth/gmail.send", // for sending emails
            "https://www.googleapis.com/auth/calendar.readonly", // for reading calender events
            "https://www.googleapis.com/auth/calendar", // for creating calender events
            "https://www.googleapis.com/auth/presentations",// For reading and writing presentations
          ].join(" "),
          access_type: "offline",
          prompt: "select_account",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          await connectToDatabase();

          // Check if user exists
          let dbUser = await User.findOne({ email: user.email });

          const tokenUpdate = {
            googleId: profile.sub,
            googleAccessToken: account.access_token,
            googleRefreshToken: account.refresh_token,
            googleTokenExpiresAt: new Date(account.expires_at * 1000),
          };

          // If user doesn't exist, create new user
          if (!dbUser) {
            dbUser = await User.create({
              email: user.email,
              name: user.name,
              role: "user",
              googleId: profile.sub,
              image: user.image,
              ...tokenUpdate,
            });
          } else {
            // Always update user's tokens on every login to refresh them
            await User.updateOne(
              { email: user.email },
              { $set: tokenUpdate }
            );
          }

          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return "/auth/error?error=DatabaseError";
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      try {
        if (account) {
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token;
          token.expiresAt = account.expires_at;
          token.idToken = account.id_token;
        }

        if (user) {
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;

          await connectToDatabase();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.role = dbUser.role || "user";
            token.userId = dbUser._id.toString();
            token.hasInterests =
              dbUser.interests && dbUser.interests.length > 0;
          }
        }

        return token;
      } catch (error) {
        console.error("Error in jwt callback:", error);
        return token;
      }
    },
    async session({ session, token }) {
      try {
        if (session?.user) {
          session.user.email = token.email;
          session.user.name = token.name;
          session.user.image = token.picture;
          session.user.role = token.role;
          session.user.id = token.userId;
          session.user.hasInterests = token.hasInterests;
          session.accessToken = token.accessToken;
          session.refreshToken = token.refreshToken;
          session.expiresAt = token.expiresAt;
        }
        return session;
      } catch (error) {
        console.error("Error in session callback:", error);
        return session;
      }
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};

/**
 * Checks if the user is authenticated by verifying their JWT token
 * @param {Object} request - The HTTP request object
 * @returns {Object|null} The user object if authenticated, null otherwise
 */
export async function isAuthenticated(request) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return null;
    }

    const authenticatedUser = {
      id: token.userId,
      email: token.email,
      name: token.name,
      role: token.role,
      hasInterests: token.hasInterests,
      image: token.picture,
    };

    return authenticatedUser;
  } catch (error) {
    console.error("Authentication error in isAuthenticated:", error);
    return null;
  }
}

/**
 * Refreshes the Google access token using the refresh token
 * @param {string} refreshToken - The Google refresh token
 * @returns {Object|null} The new token data or null if refresh failed
 */
export async function refreshGoogleToken(refreshToken) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      console.error('Failed to refresh Google token:', response.status);
      return null;
    }

    const tokenData = await response.json();
    
    return {
      accessToken: tokenData.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in,
      refreshToken: tokenData.refresh_token || refreshToken, // Google may return a new refresh token
    };
  } catch (error) {
    console.error('Error refreshing Google token:', error);
    return null;
  }
}

/**
 * Gets a valid Google access token for a user, refreshing if necessary
 * @param {string} userId - The user's ID
 * @returns {string|null} A valid access token or null if unable to get one
 */
export async function getValidGoogleAccessToken(userId) {
  try {
    await connectToDatabase();
    const user = await User.findById(userId);
    
    if (!user || !user.googleRefreshToken) {
      return null;
    }

    // Check if token is still valid (with 5 minute buffer)
    const now = new Date();
    const tokenExpiry = user.googleTokenExpiresAt;
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds

    if (tokenExpiry && tokenExpiry > new Date(now.getTime() + bufferTime)) {
      // Token is still valid
      return user.googleAccessToken;
    }

    // Token is expired or close to expiring, refresh it
    const newTokenData = await refreshGoogleToken(user.googleRefreshToken);
    
    if (!newTokenData) {
      return null;
    }

    // Update user with new token data
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          googleAccessToken: newTokenData.accessToken,
          googleTokenExpiresAt: new Date(newTokenData.expiresAt * 1000),
          googleRefreshToken: newTokenData.refreshToken,
        }
      }
    );

    return newTokenData.accessToken;
  } catch (error) {
    console.error('Error getting valid Google access token:', error);
    return null;
  }
}
