import { useEffect } from "react";
import { useLocation } from "wouter";

// This page is not actually used in the current implementation
// as the welcome page (/) and chat page (/chat) already handle
// all the required functionality. This is just a placeholder that
// redirects to the welcome page.

export default function Home() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    setLocation("/");
  }, [setLocation]);

  return null;
}
