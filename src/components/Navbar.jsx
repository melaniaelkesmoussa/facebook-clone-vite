import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import "../index.css";

const Navbar = () => {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsLoggedIn(true);
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUsername(userSnap.data().username);
        }
      } else {
        setIsLoggedIn(false);
        setUsername("");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUsername("");
    setIsLoggedIn(false);
    navigate("/"); 
  };

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        {!loading && isLoggedIn ? `Hi, ${username}` : "Face appy"}
      </div>

      <div className="navbar-links">
        <Link to="/">Home</Link>

        {isLoggedIn && <Link to="/saved">Saved</Link>}

        {!isLoggedIn && <Link to="/signup">Sign Up</Link>}
        {!isLoggedIn && <Link to="/login">Login</Link>}

        {isLoggedIn && (
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
