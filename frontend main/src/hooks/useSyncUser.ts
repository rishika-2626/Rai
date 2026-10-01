import { useUser, useAuth } from "@clerk/clerk-react";
import { useEffect } from "react";

export const useSyncUser = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded || !isSignedIn || !user) return;

      try {
        const token = await getToken();
        await fetch("http://localhost:4000/api/user/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
          }),
        });
        console.log("User synced successfully from frontend!");
      } catch (error) {
        console.error("Error syncing user profile:", error);
      }
    };

    syncUser();
  }, [isLoaded, isSignedIn, user, getToken]);
};