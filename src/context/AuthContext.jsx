useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log("Auth state changed:", user?.email, "loading will be set false");
    setCurrentUser(user);
    if (user) {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        console.log("Role fetched:", snap.data()?.role);
        setUserRole(snap.exists() ? snap.data().role : null);
      } catch (e) {
        console.error("Firestore error:", e);
        setUserRole(null);
      }
    } else {
      setUserRole(null);
    }
    setLoading(false);
  });
  return unsubscribe;
}, []);