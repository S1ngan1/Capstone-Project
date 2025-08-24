import { createContext, useContext } from "react";
import { Session } from "@supabase/supabase-js";

type AuthContextType = {
  session: Session | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuthContext must be used inside AuthContext.Provider");
  return context;
};
