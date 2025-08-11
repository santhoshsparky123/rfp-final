import { useEffect, useState } from "react";
import { useRouter } from "next/router";

// Helper function to decode JWT (without verifying signature)
function decodeJwt(token: string): { sub: string; name: string } {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return { sub: decoded.sub, name: decoded.name };
  } catch {
    return { sub: "", name: "" };
  }
}

export default function GoogleRedirectHandler() {
  const router = useRouter();
  const [userData, setUserData] = useState({ email: "", name: "" });
  const [isExistingUser, setIsExistingUser] = useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (token) {
      try {
        const decoded = decodeJwt(token);
        setUserData({ email: decoded.sub, name: decoded.name });

        // Check if the user exists in the database
        fetch(`/api/check-user?email=${decoded.sub}`)
          .then((response) => response.json())
          .then((data) => {
            if (data.exists) {
              setIsExistingUser(true);
              router.push("/login"); // Redirect to login if user exists
            }
          });
      } catch (error) {
        console.error("Invalid token", error);
      }
    }
  }, [router]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit registration form
    fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userData.email, name: userData.name, password: (e.target as HTMLFormElement).password.value }),
    })
      .then((response) => response.json())
      .then(() => {
        router.push("/login"); // Redirect to login after registration
      });
  };

  if (isExistingUser) {
    return null; // Prevent rendering if redirecting to login
  }

  return (
    <div>
      <h1>Complete Your Registration</h1>
      <form onSubmit={handleRegister}>
        <label>Email:</label>
        <input type="email" value={userData.email} readOnly />
        <label>Name:</label>
        <input type="text" value={userData.name} readOnly />
        <label>Password:</label>
        <input type="password" name="password" required />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}