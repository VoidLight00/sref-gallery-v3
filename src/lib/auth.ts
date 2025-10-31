// NextAuth configuration with Supabase Auth integration
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { supabaseServer } from './supabase-server';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    signOut: '/logout',
    error: '/auth/error',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        // Query user from Supabase
        const { data: user, error } = await supabaseServer
          .from('users')
          .select('*')
          .eq('email', credentials.email)
          .single();

        if (error || !user || !user.password_hash) {
          throw new Error('Invalid credentials');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        );

        if (!isPasswordValid) {
          throw new Error('Invalid credentials');
        }

        // Return user object for NextAuth
        return {
          id: user.id,
          email: user.email,
          name: user.username || user.name,
          image: user.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle OAuth sign-in (Google)
      if (account?.provider === 'google') {
        try {
          // Check if user exists in Supabase
          const { data: existingUser } = await supabaseServer
            .from('users')
            .select('id')
            .eq('email', user.email!)
            .single();

          if (!existingUser) {
            // Create new user in Supabase
            const { error } = await supabaseServer
              .from('users')
              .insert({
                email: user.email!,
                name: user.name || profile?.name,
                username: user.email!.split('@')[0], // Use email prefix as username
                avatar_url: user.image || profile?.image,
                email_verified: true,
              });

            if (error) {
              console.error('Error creating user:', error);
              return false;
            }
          }
        } catch (error) {
          console.error('Sign-in error:', error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        // Get user from Supabase to ensure we have the latest data
        const { data: dbUser } = await supabaseServer
          .from('users')
          .select('id, email, name, username, avatar_url, role')
          .eq('email', user.email!)
          .single();

        if (dbUser) {
          token.id = dbUser.id;
          token.email = dbUser.email;
          token.name = dbUser.name || dbUser.username;
          token.picture = dbUser.avatar_url;
          token.role = dbUser.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      // Add user info to session
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as string,
        },
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};
