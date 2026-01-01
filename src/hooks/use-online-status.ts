import { useEffect, useState } from "react";

/**
 * Hook to detect online/offline status
 * Returns true if online, false if offline
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    // Handler for when connection is restored
    function handleOnline() {
      setIsOnline(true);
    }

    // Handler for when connection is lost
    function handleOffline() {
      setIsOnline(false);
    }

    // Add event listeners
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
