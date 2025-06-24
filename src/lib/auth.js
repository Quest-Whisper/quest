import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import GoogleProvider from "next-auth/providers/google";
import { getToken } from "next-auth/jwt";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === "google") {
        try {
          await connectToDatabase();
          
          // Check if user exists
          let dbUser = await User.findOne({ email: user.email });
          
          // If user doesn't exist, create new user
          if (!dbUser) {
            dbUser = await User.create({
              email: user.email,
              name: user.name,
              role: "user",
              googleId: profile.sub,
              image: user.image,
            });
          } else {
            // Update existing user's Google ID if not set
            if (!dbUser.googleId) {
              dbUser.googleId = profile.sub;
              await dbUser.save();
            }
          }
          
          return true;
        } catch (error) {
          console.error("Error in signIn callback:", error);
          return '/auth/error?error=DatabaseError';
        }
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      try {
        if (account && user) {
          token.email = user.email;
          token.name = user.name;
          token.picture = user.image;
          
          // Get user from database to include additional info
          await connectToDatabase();
          const dbUser = await User.findOne({ email: user.email });
          if (dbUser) {
            token.role = dbUser.role || "user";
            token.userId = dbUser._id.toString();
            token.hasInterests = dbUser.interests && dbUser.interests.length > 0;
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
    signIn: '/login',
    error: '/auth/error',
  }
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
      secret: process.env.NEXTAUTH_SECRET
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
      image: token.picture
    };

    return authenticatedUser;
  } catch (error) {
    console.error('Authentication error in isAuthenticated:', error);
    return null;
  }
}
