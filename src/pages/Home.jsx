import React, { useState, useEffect } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  deleteDoc,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
} from "firebase/firestore";
import { FaHeart, FaBookmark, FaShare } from "react-icons/fa";
import { MoreHorizontal } from "lucide-react";

const Home = () => {
  const [postText, setPostText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posts, setPosts] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editImage, setEditImage] = useState("");
  const [showMenu, setShowMenu] = useState(null);

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

      setPosts(postArray);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || postText.trim() === "") return;

    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.data();

    await addDoc(collection(db, "posts"), {
      text: postText,
      image: imageUrl,
      userId: currentUser.uid,
      username: userData?.username || "Unknown",
      createdAt: serverTimestamp(),
      likes: [],
      savedBy: [],
    });

    setPostText("");
    setImageUrl("");
  };

  const handleDelete = async (id, postUserId) => {
    if (currentUser?.uid !== postUserId) return alert("You can only delete your own posts.");
    await deleteDoc(doc(db, "posts", id));
  };

  const toggleLike = async (postId, currentLikes) => {
    if (!currentUser) return;
    const ref = doc(db, "posts", postId);
    const alreadyLiked = currentLikes.includes(currentUser.uid);
    await updateDoc(ref, {
      likes: alreadyLiked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  };

  const toggleSave = async (postId, savedBy) => {
    if (!currentUser) return;
    const ref = doc(db, "posts", postId);
    const alreadySaved = savedBy.includes(currentUser.uid);
    await updateDoc(ref, {
      savedBy: alreadySaved ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid),
    });
  };

  const handleShare = async (post) => {
    if (!currentUser) return;

    if (post.sharedPost) {
      alert("you can't share it again");
      return;
    }

    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.data();

    const sharedPost = {
      text: "",
      userId: currentUser.uid,
      username: userData?.username || "Unknown",
      createdAt: serverTimestamp(),
      likes: [],
      savedBy: [],
      sharedPost: {
        text: post.text,
        username: post.username,
        image: post.image || "", // الصورة 
      },
    };

    await addDoc(collection(db, "posts"), sharedPost);
  };

  const handleEdit = async (postId) => {
    const ref = doc(db, "posts", postId);
    await updateDoc(ref, {
      text: editText,
      image: editImage,
    });
    setEditingPostId(null);
  };

  return (
    <div className="home-page">
      {currentUser ? (
        <form onSubmit={handlePostSubmit} className="post-box">
          <textarea
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
          ></textarea>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Optional image URL"
            style={{ width: "90%", marginBottom: 10, padding: 10, borderRadius: 10 }}
          />
          <button type="submit" className="post-button">
            Post
          </button>
        </form>
      ) : (
        <div className="Alert">
          <p>Please log in to post something.</p>
        </div>
      )}

      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.id} className="post-card">
            <div className="post-header">
              <div style={{ display: "flex", alignItems: "center" }}>
                <div className="post-avatar">
                  {post.username?.slice(0, 2).toUpperCase()}
                </div>
                <div className="username">{post.username}</div>
              </div>

              {currentUser?.uid === post.userId && (
                <div style={{ position: "relative" }}>
                  <button
                    onClick={() => setShowMenu(showMenu === post.id ? null : post.id)}
                    className="delete-button"
                  >
                    <MoreHorizontal />
                  </button>
                  {showMenu === post.id && (
                    <div className="post-menu">
                      <button
                        onClick={() => {
                          setEditingPostId(post.id);
                          setEditText(post.text);
                          setEditImage(post.image || "");
                          setShowMenu(null);
                        }}
                        className="post-menu-button"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.userId)}
                        className="post-menu-button delete"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {editingPostId === post.id ? (
              <div style={{ marginTop: 10 }}>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  rows={3}
                  style={{ width: "100%", marginBottom: 10 }}
                />
                <input
                  type="text"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  placeholder="Optional image URL"
                  style={{ width: "100%", marginBottom: 10, padding: 10 }}
                />
                <button onClick={() => handleEdit(post.id)}>Save</button>
              </div>
            ) : (
              <>
                {post.text && <p className="post-text">{post.text}</p>}
                {post.image && (
                  <img
                    src={post.image}
                    alt="user upload"
                    style={{ width: "100%", maxHeight: 400, objectFit: "cover", borderRadius: 10 }}
                  />
                )}
              </>
            )}

            {post.sharedPost && (
              <div className="shared-post">
                <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
                  <div className="post-avatar" style={{ width: 30, height: 30, fontSize: 13 }}>
                    {post.sharedPost.username?.slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: "bold", marginLeft: 8 }}>{post.sharedPost.username}</div>
                </div>
                <div style={{ fontSize: 14 }}>{post.sharedPost.text}</div>

                {post.sharedPost.image && (
                  <img
                    src={post.sharedPost.image}
                    alt="shared"
                    style={{
                      width: "100%",
                      maxHeight: 400,
                      objectFit: "cover",
                      borderRadius: 10,
                      marginTop: 10,
                    }}
                  />
                )}
              </div>
            )}

            <div className="post-actions">
              <button onClick={() => toggleLike(post.id, post.likes)} disabled={!currentUser}>
                <FaHeart color={post.likes.includes(currentUser?.uid) ? "red" : "gray"} /> {post.likes.length}
              </button>
              <button onClick={() => toggleSave(post.id, post.savedBy)} disabled={!currentUser}>
                <FaBookmark color={post.savedBy.includes(currentUser?.uid) ? "blue" : "gray"} />
              </button>
              <button onClick={() => handleShare(post)} disabled={!currentUser}>
                <FaShare />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
