import { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContextType = {
  session: Session | null;
  user: User | null;
  notifications: Notification[];
};

type Notification = {
  id: string;
  content: string;
  level: "urgent" | "warning" | "normal";
  timestamp: string;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used inside AuthContext.Provider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    console.log('AuthContext: Initializing authentication...');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('AuthContext: Initial session check:', session?.user?.id || 'No session');
      if (error) {
        console.error('AuthContext: Error getting session:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('AuthContext: User authenticated:', session.user.id);
        console.log('AuthContext: User email:', session.user.email);
      } else {
        console.log('AuthContext: No authenticated user found');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthContext: Auth state changed:', event, session?.user?.id || 'No user');
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('AuthContext: User logged in:', session.user.id);
      } else {
        console.log('AuthContext: User logged out');
      }
    });

    return () => {
      console.log('AuthContext: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user) {
        console.log('AuthContext: No user session for notifications');
        return;
      }

      console.log('AuthContext: Fetching notifications for user:', session.user.id);

      try {
        const { data: sensorData, error } = await supabase
          .from("sensor_data")
          .select("sensor_id, created_at")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (error) {
          console.error("AuthContext: Error fetching sensor data for notifications:", error);
          return;
        }

        if (sensorData.length === 0) {
          setNotifications((prev) => [
            ...prev,
            {
              id: "no-data-24h",
              content: "No new sensor data in the last 24 hours.",
              level: "warning",
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      } catch (err) {
        console.error("AuthContext: Unexpected error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [session]);

  // Debug logging for context values
  useEffect(() => {
    console.log('AuthContext: Context values updated:', {
      hasSession: !!session,
      hasUser: !!user,
      userId: user?.id || 'null',
      userEmail: user?.email || 'null';
    });
  }, [session, user]);

  return (
    <AuthContext.Provider value={{ session, user, notifications }}>
      {children}
    </AuthContext.Provider>
  );
};
