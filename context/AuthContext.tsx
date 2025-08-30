import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type AuthContextType = {
  session: Session | null;
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

export const AuthProvider: React.FC = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session) return;

      try {
        const { data: sensorData, error } = await supabase
          .from("sensor_data")
          .select("sensor_id, created_at")
          .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (error) {
          console.error("Error fetching sensor data:", error);
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
        console.error("Unexpected error fetching notifications:", err);
      }
    };

    fetchNotifications();
  }, [session]);

  return (
    <AuthContext.Provider value={{ session, notifications }}>
      {children}
    </AuthContext.Provider>
  );
};
