import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { FaHeart, FaShare, FaTrash } from "react-icons/fa";

const SavedPosts = () => {
  const [savedPosts, setSavedPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    const unsubscribePosts = onSnapshot(q, async (snapshot) => {
      const postArray = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();
          let likesUsernames = [];

          for (let uid of data.likes || []) {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
              likesUsernames.push(userDoc.data().username);
            }
          }

          return {
            id: docSnap.id,
            ...data,
            likesUsernames,
          };
        })
      );

      const filtered = postArray.filter((post) =>
        post.savedBy?.includes(auth.currentUser?.uid)
      );

      setSavedPosts(filtered);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const handleUnsave = async (postId) => {
    if (!currentUser) return;

    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      savedBy: arrayRemove(currentUser.uid),
    });
  };

  return (
    <div className="saved-posts-page">
      <h2 className="text-xl font-bold mb-4">Saved Posts</h2>
      {savedPosts.length === 0 ? (
        <p className="text-gray-600">No saved posts yet.</p>
      ) : (
        savedPosts.map((post) => (
          <div key={post.id} className="post-card">
            {/* Header */}
            <div
              className="post-header"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="post-avatar">
                  {post.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="username">{post.username}</div>
              </div>
            </div>

            {post.text && <p className="post-text">{post.text}</p>}

            {/*  عرض الصورة */}
            {post.image && (
              <img
                src={post.image}
                alt="user upload"
                style={{
                  width: "100%",
                  maxHeight: 400,
                  objectFit: "cover",
                  borderRadius: 10,
                  marginTop: 10,
                }}
              />
            )}

            {/* Shared Post */}
            {post.sharedPost && (
              <div
                className="shared-post"
                style={{
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "12px",
                  marginTop: "10px",
                  backgroundColor: "#f8f8f8",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <div className="post-avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
                    {post.sharedPost.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: "bold", marginLeft: 8 }}>
                    {post.sharedPost.username}
                  </div>
                </div>
                <div style={{ fontSize: 14 }}>{post.sharedPost.text}</div>
              </div>
            )}

            {/* Actions */}
            <div className="post-actions">
              <button disabled>
                <FaHeart
                  color={post.likes.includes(currentUser?.uid) ? "red" : "gray"}
                />{" "}
                {post.likes.length}
              </button>

              <button onClick={() => handleUnsave(post.id)}>
                <FaTrash color="red" />
              </button>

              <button disabled>
                <FaShare />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default SavedPosts;
