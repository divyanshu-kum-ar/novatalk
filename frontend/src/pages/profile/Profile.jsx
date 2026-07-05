import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_MALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2363b3ed'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_FEMALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f687b3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const getDefaultAvatar = (gender) => {
  if (gender === "male") return DEFAULT_AVATAR_MALE;
  if (gender === "female") return DEFAULT_AVATAR_FEMALE;
  return DEFAULT_AVATAR_GENERIC;
};

const Profile = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [profilePic, setProfilePic] = useState(authUser?.profilePic || "");
  const [updating, setUpdating] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Image size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full Name cannot be empty");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName, profilePic }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }

      const updatedUser = { ...authUser, ...data };
      localStorage.setItem("chat-user", JSON.stringify(updatedUser));
      setAuthUser(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  };

  const currentAvatarSrc = (profilePic && !profilePic.includes("avatar.iran.liara.run"))
    ? profilePic
    : getDefaultAvatar(authUser?.gender);

  return (
    <div className="flex flex-col items-center justify-center min-w-96 mx-auto">
      <div className="w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0">
        <h1 className="text-3xl font-semibold text-center text-gray-300 mb-6">
          My <span className="text-blue-500">Profile</span>
        </h1>

        <form onSubmit={handleSave} className="flex flex-col items-center gap-4">
          <div className="avatar mb-2">
            <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative group">
              <img
                src={currentAvatarSrc}
                alt="Profile Preview"
                onError={(e) => {
                  e.target.src = getDefaultAvatar(authUser?.gender);
                }}
              />
              <label className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                Change
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="w-full">
            <label className="label p-2">
              <span className="text-base label-text">Full Name</span>
            </label>
            <input
              type="text"
              className="w-full input input-bordered h-10"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="w-full">
            <label className="label p-2">
              <span className="text-base label-text">Username</span>
            </label>
            <input
              type="text"
              className="w-full input input-bordered h-10 bg-slate-700 text-gray-400 cursor-not-allowed"
              value={authUser?.username || ""}
              disabled
            />
          </div>

          <div className="w-full">
            <label className="label p-2">
              <span className="text-base label-text">Gender</span>
            </label>
            <input
              type="text"
              className="w-full input input-bordered h-10 bg-slate-700 text-gray-400 cursor-not-allowed capitalize"
              value={authUser?.gender || "unknown"}
              disabled
            />
          </div>

          <div className="w-full flex justify-between items-center mt-4">
            <Link to="/" className="text-sm hover:underline hover:text-blue-600">
              Back to Chat
            </Link>
            <button
              type="submit"
              className="btn btn-sm border border-slate-700"
              disabled={updating}
            >
              {updating ? <span className="loading loading-spinner"></span> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
