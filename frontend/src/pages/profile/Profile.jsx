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

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long");
      return;
    }
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasUppercase || !hasLowercase || !hasNumber) {
      toast.error("New password must contain at least one uppercase letter, one lowercase letter, and one number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-gray-700 rounded-lg p-6 w-96 shadow-xl text-white">
        <h2 className="text-xl font-bold mb-4 text-center">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          <div>
            <label className="label p-1">
              <span className="text-xs label-text text-gray-300">Current Password</span>
            </label>
            <input
              type="password"
              placeholder="Current Password"
              className="w-full input input-bordered bg-slate-700 text-white h-10 text-sm"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label p-1">
              <span className="text-xs label-text text-gray-300">New Password</span>
            </label>
            <input
              type="password"
              placeholder="New Password"
              className="w-full input input-bordered bg-slate-700 text-white h-10 text-sm"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label p-1">
              <span className="text-xs label-text text-gray-300">Confirm New Password</span>
            </label>
            <input
              type="password"
              placeholder="Confirm New Password"
              className="w-full input input-bordered bg-slate-700 text-white h-10 text-sm"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <div className="flex justify-between items-center mt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-ghost hover:bg-slate-700 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm bg-blue-600 hover:bg-blue-500 border-none text-white"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Profile = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [profilePic, setProfilePic] = useState(authUser?.profilePic || "");
  const [about, setAbout] = useState(authUser?.about || "");
  const [updating, setUpdating] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [lastSeenPrivacy, setLastSeenPrivacy] = useState(authUser?.privacySettings?.lastSeen || "everyone");
  const [onlineStatusPrivacy, setOnlineStatusPrivacy] = useState(authUser?.privacySettings?.onlineStatus || "everyone");
  const [profilePhotoPrivacy, setProfilePhotoPrivacy] = useState(authUser?.privacySettings?.profilePhoto || "everyone");
  const [aboutPrivacy, setAboutPrivacy] = useState(authUser?.privacySettings?.about || "everyone");
  const [readReceipts, setReadReceipts] = useState(authUser?.privacySettings?.readReceipts !== false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload only JPG, JPEG, PNG, or WebP images");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
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
    const trimmedFullName = fullName.trim();
    if (!trimmedFullName) {
      toast.error("Full Name cannot be empty");
      return;
    }
    if (trimmedFullName.length < 3) {
      toast.error("Full Name must be at least 3 characters long");
      return;
    }
    if (trimmedFullName.length > 30) {
      toast.error("Full Name must not exceed 30 characters");
      return;
    }
    if (about.length > 150) {
      toast.error("About / Bio must not exceed 150 characters");
      return;
    }

    setUpdating(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: trimmedFullName,
          profilePic,
          about,
          privacySettings: {
            lastSeen: lastSeenPrivacy,
            onlineStatus: onlineStatusPrivacy,
            profilePhoto: profilePhotoPrivacy,
            about: aboutPrivacy,
            readReceipts,
          }
        }),
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
                  accept=".jpg,.jpeg,.png,.webp"
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
            <label className="label p-2 flex justify-between">
              <span className="text-base label-text">About / Bio</span>
              <span className="text-xs text-gray-400">{about.length}/150</span>
            </label>
            <textarea
              className="w-full textarea textarea-bordered h-20 resize-none"
              placeholder="Tell us about yourself..."
              maxLength={150}
              value={about}
              onChange={(e) => setAbout(e.target.value)}
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

          <div className="w-full border-t border-gray-700 pt-4 mt-2">
            <h3 className="text-lg font-semibold text-gray-300 mb-3">Privacy Settings</h3>
            
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Last Seen</span>
                <select
                  className="select select-bordered select-sm bg-slate-700 text-white"
                  value={lastSeenPrivacy}
                  onChange={(e) => setLastSeenPrivacy(e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Online Status</span>
                <select
                  className="select select-bordered select-sm bg-slate-700 text-white"
                  value={onlineStatusPrivacy}
                  onChange={(e) => setOnlineStatusPrivacy(e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Profile Photo</span>
                <select
                  className="select select-bordered select-sm bg-slate-700 text-white"
                  value={profilePhotoPrivacy}
                  onChange={(e) => setProfilePhotoPrivacy(e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">About / Bio</span>
                <select
                  className="select select-bordered select-sm bg-slate-700 text-white"
                  value={aboutPrivacy}
                  onChange={(e) => setAboutPrivacy(e.target.value)}
                >
                  <option value="everyone">Everyone</option>
                  <option value="contacts">Contacts</option>
                  <option value="nobody">Nobody</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">Read Receipts</span>
                <input
                  type="checkbox"
                  className="toggle toggle-primary"
                  checked={readReceipts}
                  onChange={(e) => setReadReceipts(e.target.checked)}
                />
              </div>
            </div>
          </div>

          <div className="w-full flex flex-col gap-2 mt-4">
            <button
              type="submit"
              className="w-full btn btn-sm bg-blue-600 hover:bg-blue-500 border-none text-white"
              disabled={updating}
            >
              {updating ? <span className="loading loading-spinner"></span> : "Save Changes"}
            </button>
            
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full btn btn-sm border border-slate-700 bg-transparent hover:bg-slate-700 text-white"
            >
              Change Password
            </button>
          </div>

          <div className="w-full flex justify-center mt-2">
            <Link to="/" className="text-sm hover:underline hover:text-blue-600">
              Back to Chat
            </Link>
          </div>
        </form>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
};

export default Profile;
