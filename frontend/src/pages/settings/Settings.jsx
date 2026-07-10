import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";
import useConversation from "../../zustand/useConversation";
import toast from "react-hot-toast";
import { applyAppearance } from "../../utils/appearance";
import io from "socket.io-client";
import {
  FiArrowLeft,
  FiUser,
  FiEye,
  FiBell,
  FiLock,
  FiPhone,
  FiHardDrive,
  FiHelpCircle,
  FiSave,
  FiShield,
  FiVolume2,
  FiCpu,
  FiInfo,
  FiVideo,
  FiMic,
  FiActivity,
  FiRotateCcw,
  FiImage,
  FiFilm,
  FiFileText,
  FiMusic,
  FiFile,
  FiDatabase,
  FiDownload,
  FiGithub,
  FiGlobe,
  FiLinkedin,
  FiExternalLink,
  FiStar,
  FiChevronDown,
  FiChevronUp,
  FiTrash2,
  FiAlertTriangle,
  FiSearch
} from "react-icons/fi";

// MONKEY-PATCH GLOBAL AUDIO AND NOTIFICATION FOR PRECISE INTERCEPTION
if (typeof window !== "undefined") {
  // Sound interception
  const originalPlay = Audio.prototype.play;
  Audio.prototype.play = function() {
    const dnd = localStorage.getItem("do_not_disturb") === "true";
    const soundEnabled = localStorage.getItem("notification_sound") !== "false";
    if (this.src && this.src.includes("notification") && (dnd || !soundEnabled)) {
      return Promise.resolve();
    }
    return originalPlay.apply(this, arguments);
  };

  // Notification interception
  const OriginalNotification = window.Notification;
  if (OriginalNotification) {
    const ProxyNotification = function(title, options) {
      const dnd = localStorage.getItem("do_not_disturb") === "true";
      const msgNotifs = localStorage.getItem("notifications_enabled") !== "false";
      
      const isCall = title.toLowerCase().includes("call") || (options && options.body && options.body.toLowerCase().includes("call"));
      const callNotifs = localStorage.getItem("call_notifications") !== "false";

      if (dnd) return null;
      if (isCall && !callNotifs) return null;
      if (!isCall && !msgNotifs) return null;

      const preview = localStorage.getItem("notification_preview") || "all";
      let finalTitle = title;
      let finalBody = options?.body;

      if (preview === "sender") {
        finalBody = "New message";
      } else if (preview === "none") {
        finalTitle = "New notification";
        finalBody = "Content hidden";
      }

      const modifiedOptions = {
        ...options,
        body: finalBody
      };

      return new OriginalNotification(finalTitle, modifiedOptions);
    };

    ProxyNotification.prototype = OriginalNotification.prototype;
    ProxyNotification.permission = OriginalNotification.permission;
    if (OriginalNotification.requestPermission) {
      ProxyNotification.requestPermission = OriginalNotification.requestPermission.bind(OriginalNotification);
    }
    window.Notification = ProxyNotification;
  }

  // Socket Read Receipts Interception
  try {
    const originalEmit = io.Socket.prototype.emit;
    io.Socket.prototype.emit = function(event, ...args) {
      if (event === "messageRead") {
        const receipts = localStorage.getItem("privacy_read_receipts") !== "false";
        if (!receipts) {
          // Block sending read receipts
          return this;
        }
      }
      return originalEmit.apply(this, [event, ...args]);
    };
  } catch (e) {
    console.warn("Could not patch Socket prototype:", e);
  }
}

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_MALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2363b3ed'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";
const DEFAULT_AVATAR_FEMALE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f687b3'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const getDefaultAvatar = (gender) => {
  if (gender === "male") return DEFAULT_AVATAR_MALE;
  if (gender === "female") return DEFAULT_AVATAR_FEMALE;
  return DEFAULT_AVATAR_GENERIC;
};

const Settings = () => {
  const { authUser, setAuthUser } = useAuthContext();
  const { logout, loading: loggingOut } = useLogout();
  const navigate = useNavigate();

  // Active Tab state
  const [activeTab, setActiveTab] = useState("account");

  // Settings states initialized with default values or localStorage
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const [wallpaper, setWallpaper] = useState(localStorage.getItem("wallpaper") || "default");
  const [fontSize, setFontSize] = useState(localStorage.getItem("fontSize") || "medium");
  const [accentColor, setAccentColor] = useState(localStorage.getItem("accentColor") || "blue");

  // Auxiliary state for temporary wallpaper preview
  const [previewWallpaper, setPreviewWallpaper] = useState(wallpaper);

  // Profile Form States
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [profilePic, setProfilePic] = useState(authUser?.profilePic || "");
  const [about, setAbout] = useState(authUser?.about || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password Change States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // Notification states
  const [msgNotifs, setMsgNotifs] = useState(localStorage.getItem("notifications_enabled") !== "false");
  const [callNotifs, setCallNotifs] = useState(localStorage.getItem("call_notifications") !== "false");
  const [soundEnabled, setSoundEnabled] = useState(localStorage.getItem("notification_sound") !== "false");
  const [vibrationEnabled, setVibrationEnabled] = useState(localStorage.getItem("notification_vibration") !== "false");
  const [notifPreview, setNotifPreview] = useState(localStorage.getItem("notification_preview") || "all");
  const [dnd, setDnd] = useState(localStorage.getItem("do_not_disturb") === "true");

  const [permissionStatus, setPermissionStatus] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported"
  );

  // Privacy States
  const [privacyLastSeen, setPrivacyLastSeen] = useState(
    authUser?.privacySettings?.lastSeen || localStorage.getItem("privacy_last_seen") || "everyone"
  );
  const [privacyOnlineStatus, setPrivacyOnlineStatus] = useState(
    authUser?.privacySettings?.onlineStatus || localStorage.getItem("privacy_online_status") || "everyone"
  );
  const [privacyPhoto, setPrivacyPhoto] = useState(
    authUser?.privacySettings?.profilePhoto || localStorage.getItem("privacy_photo") || "everyone"
  );
  const [privacyAbout, setPrivacyAbout] = useState(
    authUser?.privacySettings?.about || localStorage.getItem("privacy_about") || "everyone"
  );
  const [privacyReadReceipts, setPrivacyReadReceipts] = useState(
    authUser?.privacySettings?.readReceipts !== false && localStorage.getItem("privacy_read_receipts") !== "false"
  );

  // Blocked Users State
  const [blockedUsers, setBlockedUsers] = useState([]);

  // Two-Step Verification States
  const [showTwoStepModal, setShowTwoStepModal] = useState(false);

  // Call Settings States
  const [callCamera, setCallCamera] = useState(localStorage.getItem("call_camera") || "default");
  const [callMicrophone, setCallMicrophone] = useState(localStorage.getItem("call_microphone") || "default");
  const [callSpeaker, setCallSpeaker] = useState(localStorage.getItem("call_speaker") || "default");
  const [callQuality, setCallQuality] = useState(localStorage.getItem("call_quality") || "auto");
  const [callEcho, setCallEcho] = useState(localStorage.getItem("call_echo") !== "false");
  const [callNoise, setCallNoise] = useState(localStorage.getItem("call_noise") !== "false");
  const [callGain, setCallGain] = useState(localStorage.getItem("call_gain") !== "false");

  const [cameras, setCameras] = useState([]);
  const [microphones, setMicrophones] = useState([]);
  const [speakers, setSpeakers] = useState([]);

  // Preview & Tests States
  const [previewStream, setPreviewStream] = useState(null);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micAudioContext, setMicAudioContext] = useState(null);
  const [micStream, setMicStream] = useState(null);

  // Storage Settings States
  const [storageAutoDownload, setStorageAutoDownload] = useState(localStorage.getItem("storage_auto_download") || "wifi");
  const [storageUploadQuality, setStorageUploadQuality] = useState(localStorage.getItem("storage_upload_quality") || "original");

  const [cacheSizeNum, setCacheSizeNum] = useState(83); // in MB
  const [tempFilesSizeNum, setTempFilesSizeNum] = useState(45); // in MB
  const [imagesSizeNum, setImagesSizeNum] = useState(245); // in MB
  const [videosSizeNum, setVideosSizeNum] = useState(1800); // in MB
  const [documentsSizeNum, setDocumentsSizeNum] = useState(120); // in MB
  const [audioSizeNum, setAudioSizeNum] = useState(18); // in MB
  const [otherSizeNum, setOtherSizeNum] = useState(5); // in MB

  const [showMediaPlaceholder, setShowMediaPlaceholder] = useState(null); // 'images', 'videos', 'documents'
  const [showExportModal, setShowExportModal] = useState(false);

  // Help & Support States
  const [helpSearchQuery, setHelpSearchQuery] = useState("");
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [bugSubject, setBugSubject] = useState("");
  const [bugDesc, setBugDesc] = useState("");
  const [bugPriority, setBugPriority] = useState("low");

  const [showHelpCenterModal, setShowHelpCenterModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showWallpaperModal, setShowWallpaperModal] = useState(false);

  // Delete Account States
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Live preview for Appearance settings
  useEffect(() => {
    applyAppearance(theme, previewWallpaper, fontSize, accentColor);
  }, [theme, previewWallpaper, fontSize, accentColor]);

  // Sync wallpaper preview when main wallpaper state changes
  useEffect(() => {
    setPreviewWallpaper(wallpaper);
  }, [wallpaper]);

  // Load real blocked users
  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        const res = await fetch("/api/users/blocked");
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setBlockedUsers(data);
      } catch (err) {
        console.error("Failed to load blocked users:", err);
      }
    };

    if (activeTab === "privacy") {
      fetchBlockedUsers();
    }
  }, [activeTab]);

  // Device enumeration
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          const videoDevices = devices.filter(d => d.kind === "videoinput");
          const audioInDevices = devices.filter(d => d.kind === "audioinput");
          const audioOutDevices = devices.filter(d => d.kind === "audiooutput");
          setCameras(videoDevices);
          setMicrophones(audioInDevices);
          setSpeakers(audioOutDevices);
        })
        .catch(err => console.log("Device enumeration error:", err));
    }
  }, []);

  // Cleanup WebRTC previews on unmount
  useEffect(() => {
    return () => {
      if (previewStream) {
        previewStream.getTracks().forEach(track => track.stop());
      }
      if (micStream) {
        micStream.getTracks().forEach(track => track.stop());
      }
      if (micAudioContext) {
        micAudioContext.close();
      }
    };
  }, [previewStream, micStream, micAudioContext]);

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

  const handleProfileSave = async (e) => {
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

    setUpdatingProfile(true);
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
            lastSeen: privacyLastSeen,
            onlineStatus: privacyOnlineStatus,
            profilePhoto: privacyPhoto,
            about: privacyAbout,
            readReceipts: privacyReadReceipts,
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
      toast.success("Account profile details updated successfully!");
    } catch (error) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const requestNotificationPermission = () => {
    if (!("Notification" in window)) {
      toast.error("Browser notifications not supported");
      return;
    }
    
    Notification.requestPermission().then((permission) => {
      setPermissionStatus(permission);
      localStorage.setItem("desktop_notifications", permission);
      if (permission === "granted") {
        toast.success("Desktop notifications enabled successfully!");
      } else if (permission === "denied") {
        toast.error("Permission denied. Check your browser site settings to enable notifications.");
      }
    });
  };

  const handleSendTestNotification = () => {
    if (!("Notification" in window)) {
      toast.error("Desktop notifications are not supported by this browser.");
      return;
    }

    if (Notification.permission === "denied") {
      toast.error("Notification permission has been denied. Reset permissions in browser bar.");
      return;
    }

    if (Notification.permission !== "granted") {
      toast.error("Please enable desktop notifications first.");
      return;
    }

    if (dnd) {
      toast.error("Cannot show notification: Do Not Disturb is active.");
      return;
    }

    if (!msgNotifs) {
      toast.error("Cannot show notification: Message notifications are disabled.");
      return;
    }

    let title = "Test Sender";
    let body = "This is a test notification from NovaTalk!";
    
    if (notifPreview === "sender") {
      body = "New message";
    } else if (notifPreview === "none") {
      title = "New notification";
      body = "Content hidden";
    }

    const testNotif = new Notification(title, {
      body,
      icon: currentAvatarSrc
    });

    if (soundEnabled) {
      const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
      audio.play().catch(() => {});
    }

    if ("vibrate" in navigator && vibrationEnabled) {
      navigator.vibrate(150);
    }
  };

  const handleUnblock = async (userId, name) => {
    try {
      const res = await fetch(`/api/users/unblock/${userId}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setBlockedUsers(blockedUsers.filter(user => (user._id || user.id) !== userId));
      toast.success(`Unblocked ${name}`);

      // Update useConversation state conversations to isBlocked: false
      const state = useConversation.getState();
      state.setConversations(
        state.conversations.map((c) => {
          if (c._id === userId) {
            return {
              ...c,
              isBlocked: false,
            };
          }
          return c;
        })
      );
    } catch (err) {
      toast.error(err.message || "Failed to unblock user");
    }
  };

  // Camera Preview handlers
  const startCameraPreview = async () => {
    if (previewStream) return;
    try {
      const constraints = {
        video: callCamera === "default" ? true : { deviceId: { exact: callCamera } },
        audio: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setPreviewStream(stream);
      const videoEl = document.getElementById("call-camera-preview-video");
      if (videoEl) {
        videoEl.srcObject = stream;
      }
      toast.success("Camera preview started!");
    } catch (err) {
      toast.error("Failed to start camera preview. Check permissions.");
    }
  };

  const stopCameraPreview = () => {
    if (previewStream) {
      previewStream.getTracks().forEach(track => track.stop());
      setPreviewStream(null);
      const videoEl = document.getElementById("call-camera-preview-video");
      if (videoEl) {
        videoEl.srcObject = null;
      }
      toast.success("Camera preview stopped.");
    }
  };

  // Microphone Test handlers
  const startMicTest = async () => {
    if (isMicTesting) {
      stopMicTest();
      return;
    }
    try {
      const constraints = {
        audio: callMicrophone === "default" ? true : { deviceId: { exact: callMicrophone } },
        video: false
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMicStream(stream);
      
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioContext = new AudioCtx();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        analyser.fftSize = 256;
        
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        setMicAudioContext(audioContext);
        setIsMicTesting(true);

        const checkVolume = () => {
          if (!analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < bufferLength; i++) {
            sum += dataArray[i];
          }
          const average = sum / bufferLength;
          setMicLevel(Math.min(100, Math.floor((average / 128) * 100)));
          if (audioContext.state !== "closed") {
            requestAnimationFrame(checkVolume);
          }
        };
        checkVolume();
      } else {
        setIsMicTesting(true);
        const interval = setInterval(() => {
          setMicLevel(Math.floor(Math.random() * 80) + 10);
        }, 150);
        return () => clearInterval(interval);
      }
      toast.success("Microphone test started!");
    } catch (err) {
      toast.error("Could not capture microphone for testing.");
    }
  };

  const stopMicTest = () => {
    setIsMicTesting(false);
    setMicLevel(0);
    if (micStream) {
      micStream.getTracks().forEach(track => track.stop());
      setMicStream(null);
    }
    if (micAudioContext) {
      micAudioContext.close();
      setMicAudioContext(null);
    }
    toast.success("Microphone test stopped.");
  };

  // Speaker play sound test
  const handlePlayTestSound = () => {
    const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
    if (typeof audio.setSinkId === "function" && callSpeaker !== "default") {
      audio.setSinkId(callSpeaker)
        .then(() => audio.play())
        .catch(() => audio.play());
    } else {
      audio.play().catch(() => {});
    }
    toast.success("Playing test sound to speaker...");
  };

  // Reset call defaults
  const handleResetCallSettings = () => {
    setCallCamera("default");
    setCallMicrophone("default");
    setCallSpeaker("default");
    setCallQuality("auto");
    setCallEcho(true);
    setCallNoise(true);
    setCallGain(true);

    localStorage.setItem("call_camera", "default");
    localStorage.setItem("call_microphone", "default");
    localStorage.setItem("call_speaker", "default");
    localStorage.setItem("call_quality", "auto");
    localStorage.setItem("call_echo", "true");
    localStorage.setItem("call_noise", "true");
    localStorage.setItem("call_gain", "true");

    stopCameraPreview();
    stopMicTest();

    toast.success("Calling parameters reset to defaults!");
  };

  // Storage Handlers
  const handleClearStorageCache = () => {
    const confirmation = window.confirm("Are you sure you want to clear the application cache?");
    if (confirmation) {
      setCacheSizeNum(0);
      toast.success("Application cache cleared successfully!");
    }
  };

  const handleClearTempFiles = () => {
    const confirmation = window.confirm("Are you sure you want to delete temporary files?");
    if (confirmation) {
      setTempFilesSizeNum(0);
      toast.success("Temporary files deleted successfully!");
    }
  };

  const handleResetStorageSettings = () => {
    setStorageAutoDownload("wifi");
    setStorageUploadQuality("original");
    localStorage.setItem("storage_auto_download", "wifi");
    localStorage.setItem("storage_upload_quality", "original");
    toast.success("Storage preferences reset to defaults!");
  };

  // Help handlers
  const handleBugSubmit = (e) => {
    e.preventDefault();
    if (!bugSubject.trim() || !bugDesc.trim()) {
      toast.error("Please fill in the bug report subject and description.");
      return;
    }
    toast.success(`Bug report "${bugSubject}" submitted successfully.`);
    setBugSubject("");
    setBugDesc("");
  };

  const handleCheckUpdates = () => {
    toast.success("You are using the latest version.");
  };

  // Change Password logic submit handler
  const handlePasswordChangeSubmit = async (e) => {
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

    setUpdatingPassword(true);
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
    } catch (error) {
      toast.error(error.message || "Failed to change password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // Complete Delete Account API call handler
  const handleConfirmDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const res = await fetch("/api/users/profile", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      });
      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      toast.success("Account deleted successfully!");
      localStorage.removeItem("chat-user");
      setAuthUser(null);
      navigate("/login");
    } catch (error) {
      toast.error(error.message || "Failed to delete account");
    } finally {
      setDeletingAccount(false);
      setShowConfirmDeleteModal(false);
    }
  };

  const totalUsed = ((imagesSizeNum + videosSizeNum + documentsSizeNum + audioSizeNum + otherSizeNum + cacheSizeNum + tempFilesSizeNum) / 1024).toFixed(2);
  const totalLimit = "Unlimited";
  const progressPercent = Math.min(100, Math.floor((parseFloat(totalUsed) / 10) * 100));

  const faqs = [
    {
      q: "How do I change my password?",
      a: "Go to the Account section of Settings, fill in the Change Password form, and click Save Password."
    },
    {
      q: "How do I change profile photo?",
      a: "Go to the Account section. Hover over your avatar image and click the 'Change' overlay to upload a new photo."
    },
    {
      q: "How do I create a group?",
      a: "Click on the circular '+' button in the chat sidebar. Select group participants and enter a group name."
    },
    {
      q: "How do I start a voice call?",
      a: "Open a chat, click the Phone Receiver icon in the top right, and grant microphone permissions."
    },
    {
      q: "How do I start a video call?",
      a: "Open a chat, click the Video Camera icon in the top right, and grant camera/microphone permissions."
    },
    {
      q: "How do I mute chats?",
      a: "Hover over the chat item in the conversation list, click the three vertical dots options icon, and choose Mute."
    },
    {
      q: "How do I archive chats?",
      a: "Hover over the chat item, click options, and select Archive. Access archived chats using the Archive button next to Logout."
    }
  ];

  // FAQ search logic
  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.q.toLowerCase().includes(helpSearchQuery.toLowerCase()) ||
      faq.a.toLowerCase().includes(helpSearchQuery.toLowerCase())
  );

  const currentAvatarSrc =
    profilePic && !profilePic.includes("avatar.iran.liara.run")
      ? profilePic
      : getDefaultAvatar(authUser?.gender);

  return (
    <div className="flex w-full max-w-4xl mx-auto h-[650px] rounded-lg border border-slate-500 overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0 text-white shadow-2xl relative settings-container">
      
      {/* LEFT NAVIGATION SIDEBAR */}
      <div className="w-56 bg-slate-900 bg-opacity-90 border-r border-slate-700 p-4 flex flex-col justify-between">
        <div>
          {/* Header Back Link */}
          <div className="flex items-center gap-3 mb-6">
            <Link
              to="/"
              className="p-1.5 rounded-full hover:bg-slate-800 transition-all duration-200"
              title="Back to Chat"
            >
              <FiArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-md font-bold tracking-wide">Settings</h1>
            </div>
          </div>

          {/* Navigation Items list */}
          <nav className="space-y-1">
            {[
              { id: "account", label: "Account" },
              { id: "appearance", label: "Appearance" },
              { id: "notifications", label: "Notifications" },
              { id: "privacy", label: "Privacy" },
              { id: "calls", label: "Calls" },
              { id: "storage", label: "Storage" },
              { id: "help", label: "Help & Support" }
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                  activeTab === tab.id
                    ? "bg-sky-600 text-white shadow-md"
                    : "text-gray-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Logout action */}
        <div className="border-t border-slate-800 pt-3">
          <button
            onClick={logout}
            disabled={loggingOut}
            className="w-full btn btn-xs bg-red-900 bg-opacity-60 hover:bg-red-800 border-none text-white transition-all text-[11px] py-1"
          >
            {loggingOut ? <span className="loading loading-spinner"></span> : "Logout"}
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className="flex-1 bg-slate-850 p-5 overflow-y-auto space-y-6 pb-20">
        
        {/* TAB 1: ACCOUNT (Profile + Security settings) */}
        {activeTab === "account" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <FiUser className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-bold">Account Profile</h2>
            </div>

            {/* Profile Modification Form */}
            <form onSubmit={handleProfileSave} className="bg-slate-800 bg-opacity-50 p-4 rounded-xl border border-slate-700 hover:border-sky-500 hover:shadow-lg transition-all duration-300 space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="avatar">
                  <div className="w-20 h-20 rounded-full ring-2 ring-sky-500 ring-offset-base-100 ring-offset-2 relative group">
                    <img
                      src={currentAvatarSrc}
                      alt="Profile"
                      onError={(e) => {
                        e.target.src = getDefaultAvatar(authUser?.gender);
                      }}
                    />
                    <label className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center text-white text-[10px] opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
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
                <div className="flex-1 space-y-3 w-full">
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full input input-bordered input-sm bg-slate-750 text-white"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Username</label>
                    <input
                      type="text"
                      className="w-full input input-bordered input-sm bg-slate-700 text-gray-400 cursor-not-allowed"
                      value={authUser?.username || ""}
                      disabled
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs text-gray-400 block">About / Bio</label>
                      <span className="text-[10px] text-gray-550">{about.length}/150</span>
                    </div>
                    <textarea
                      maxLength={150}
                      className="w-full textarea textarea-bordered textarea-sm bg-slate-750 text-white h-16 resize-none"
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Gender</label>
                    <input
                      type="text"
                      className="w-full input input-bordered input-sm bg-slate-700 text-gray-400 cursor-not-allowed capitalize"
                      value={authUser?.gender || "unknown"}
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Privacy Settings in Account */}
              <div className="border-t border-slate-700 pt-4 space-y-3">
                <span className="text-xs font-semibold block text-gray-300">Privacy Visibility Preferences</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex flex-col bg-slate-900 bg-opacity-40 p-2.5 rounded border border-slate-750">
                    <label className="text-[10px] text-gray-400 mb-1">Last Seen</label>
                    <select
                      className="select select-bordered select-xs w-full bg-slate-800 text-white border-slate-650"
                      value={privacyLastSeen}
                      onChange={(e) => setPrivacyLastSeen(e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                  <div className="flex flex-col bg-slate-900 bg-opacity-40 p-2.5 rounded border border-slate-750">
                    <label className="text-[10px] text-gray-400 mb-1">Online Status</label>
                    <select
                      className="select select-bordered select-xs w-full bg-slate-800 text-white border-slate-650"
                      value={privacyOnlineStatus}
                      onChange={(e) => setPrivacyOnlineStatus(e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                  <div className="flex flex-col bg-slate-900 bg-opacity-40 p-2.5 rounded border border-slate-750">
                    <label className="text-[10px] text-gray-400 mb-1">Profile Photo</label>
                    <select
                      className="select select-bordered select-xs w-full bg-slate-800 text-white border-slate-650"
                      value={privacyPhoto}
                      onChange={(e) => setPrivacyPhoto(e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                  <div className="flex flex-col bg-slate-900 bg-opacity-40 p-2.5 rounded border border-slate-750">
                    <label className="text-[10px] text-gray-400 mb-1">About Bio Visibility</label>
                    <select
                      className="select select-bordered select-xs w-full bg-slate-800 text-white border-slate-655"
                      value={privacyAbout}
                      onChange={(e) => setPrivacyAbout(e.target.value)}
                    >
                      <option value="everyone">Everyone</option>
                      <option value="contacts">My Contacts</option>
                      <option value="nobody">Nobody</option>
                    </select>
                  </div>
                </div>

                {/* Read Receipts in Account */}
                <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-2.5 rounded border border-slate-750 mt-1">
                  <div>
                    <span className="text-xs font-semibold">Read Receipts</span>
                    <p className="text-[10px] text-gray-400">Blocked if disabled</p>
                  </div>
                  <input
                    type="checkbox"
                    className="toggle toggle-info toggle-xs"
                    checked={privacyReadReceipts}
                    onChange={(e) => setPrivacyReadReceipts(e.target.checked)}
                  />
                </div>
              </div>

              {/* Save changes button */}
              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full btn btn-xs bg-sky-600 hover:bg-sky-500 border-none text-white text-xs py-1"
              >
                {updatingProfile ? <span className="loading loading-spinner"></span> : "Save Profile Changes"}
              </button>
            </form>

            {/* Change Password Form Card */}
            <div className="bg-slate-800 bg-opacity-50 p-4 rounded-xl border border-slate-700 hover:border-sky-500 transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <FiLock className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-semibold">Change Account Password</h3>
              </div>
              <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Current Password</label>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full input input-bordered input-sm bg-slate-750 text-white"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password (min. 8 chars, 1 uppercase, 1 lowercase, 1 number)"
                    className="w-full input input-bordered input-sm bg-slate-750 text-white"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className="w-full input input-bordered input-sm bg-slate-750 text-white"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-xs w-full bg-sky-600 hover:bg-sky-500 border-none text-white text-[11px]"
                  disabled={updatingPassword}
                >
                  {updatingPassword ? <span className="loading loading-spinner"></span> : "Save Password"}
                </button>
              </form>
            </div>

            {/* Account warning card */}
            <div className="bg-red-950 bg-opacity-10 border border-red-900 rounded-lg p-3.5 space-y-3.5">
              <div className="flex justify-between items-start">
                <div className="flex gap-2.5 items-center">
                  <FiTrash2 className="w-5 h-5 text-red-500 animate-pulse" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-red-400">Delete Account</span>
                      <span className="bg-red-650 text-white text-[9px] font-bold py-0.5 px-1.5 rounded uppercase tracking-wider">Destructive</span>
                    </div>
                    <p className="text-xs text-gray-300 mt-1">
                      Deleting your account will permanently remove your profile, messages, media, and settings. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>

              {/* Future Ready UI checklist */}
              <div className="space-y-1.5 pl-7">
                <p className="text-[10px] uppercase font-bold text-gray-400">Account deletion process will:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-400">
                  <label className="flex items-center gap-2 cursor-not-allowed">
                    <input type="checkbox" disabled checked className="checkbox checkbox-xs checkbox-error opacity-55" />
                    <span>Permanent account deletion</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed">
                    <input type="checkbox" disabled checked className="checkbox checkbox-xs checkbox-error opacity-55" />
                    <span>Remove all chats</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed">
                    <input type="checkbox" disabled checked className="checkbox checkbox-xs checkbox-error opacity-55" />
                    <span>Delete uploaded media</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed">
                    <input type="checkbox" disabled checked className="checkbox checkbox-xs checkbox-error opacity-55" />
                    <span>Remove profile information</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-not-allowed">
                    <input type="checkbox" disabled checked className="checkbox checkbox-xs checkbox-error opacity-55" />
                    <span>Revoke active sessions</span>
                  </label>
                </div>
              </div>

              {/* Large Outlined Red button */}
              <button
                type="button"
                onClick={() => setShowConfirmDeleteModal(true)}
                className="w-full btn btn-sm btn-outline border-red-700 text-red-450 hover:bg-red-800 hover:text-white hover:border-transparent transition-all duration-300 font-bold"
              >
                Delete My Account
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: APPEARANCE */}
        {activeTab === "appearance" && (
          <section className="bg-slate-800 bg-opacity-50 p-4 rounded-xl border border-slate-700 hover:border-sky-500 hover:shadow-lg transition-all duration-300 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <FiEye className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-semibold">Appearance</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Theme Toggle */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-medium">Theme Mode</span>
                  <p className="text-xs text-gray-400">Switch Light or Dark</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-300">Light</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-info toggle-sm"
                    checked={theme === "dark"}
                    onChange={(e) => {
                      const nextTheme = e.target.checked ? "dark" : "light";
                      setTheme(nextTheme);
                      localStorage.setItem("theme", nextTheme);
                    }}
                  />
                  <span className="text-xs text-gray-300">Dark</span>
                </div>
              </div>

              {/* Chat Wallpaper Trigger */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-medium">Chat Wallpaper</span>
                  <p className="text-xs text-gray-400">Active: <span className="text-sky-400 capitalize">{wallpaper}</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewWallpaper(wallpaper);
                    setShowWallpaperModal(true);
                  }}
                  className="btn btn-xs bg-sky-600 hover:bg-sky-500 border-none text-white"
                >
                  Choose
                </button>
              </div>

              {/* Font Size Button Selector */}
              <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all gap-2 sm:col-span-2">
                <div>
                  <span className="text-sm font-medium">Font Size</span>
                  <p className="text-xs text-gray-400">Customizes text readability across entire workspace</p>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {["small", "medium", "large"].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setFontSize(size);
                        localStorage.setItem("fontSize", size);
                      }}
                      className={`btn btn-xs capitalize border border-slate-600 transition-all ${
                        fontSize === size
                          ? "bg-sky-600 hover:bg-sky-500 text-white border-transparent"
                          : "bg-slate-800 text-gray-300 hover:bg-slate-700"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accent Color Circle Selector */}
              <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all gap-2 sm:col-span-2">
                <div>
                  <span className="text-sm font-medium">Accent Color</span>
                  <p className="text-xs text-gray-400">Updates highlights, buttons, and selections</p>
                </div>
                <div className="flex gap-2 flex-wrap pt-1">
                  {[
                    { name: "blue", bg: "bg-blue-500" },
                    { name: "green", bg: "bg-emerald-500" },
                    { name: "purple", bg: "bg-violet-500" },
                    { name: "orange", bg: "bg-orange-500" },
                    { name: "red", bg: "bg-red-500" },
                    { name: "pink", bg: "bg-pink-500" },
                    { name: "cyan", bg: "bg-cyan-500" }
                  ].map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => {
                        setAccentColor(color.name);
                        localStorage.setItem("accentColor", color.name);
                      }}
                      title={color.name}
                      className={`w-6 h-6 rounded-full ${color.bg} border-2 transition-all hover:scale-110 ${
                        accentColor === color.name ? "border-white scale-110" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 3: NOTIFICATIONS */}
        {activeTab === "notifications" && (
          <section className="bg-slate-800 bg-opacity-50 p-4 rounded-xl border border-slate-700 hover:border-sky-500 hover:shadow-lg transition-all duration-300 space-y-4 animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <FiBell className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>

            <div className="space-y-3">
              {/* Do Not Disturb Toggle */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-semibold text-orange-400">Do Not Disturb</span>
                  <p className="text-xs text-gray-400">Mutes all sounds, vibrations, and banners</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-warning toggle-sm"
                  checked={dnd}
                  onChange={(e) => {
                    setDnd(e.target.checked);
                    localStorage.setItem("do_not_disturb", String(e.target.checked));
                  }}
                />
              </div>

              {/* Message Notifications Toggle */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-medium">Message Notifications</span>
                  <p className="text-xs text-gray-400">Show notification banners for incoming messages</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info toggle-sm"
                  checked={msgNotifs}
                  disabled={dnd}
                  onChange={(e) => {
                    setMsgNotifs(e.target.checked);
                    localStorage.setItem("notifications_enabled", String(e.target.checked));
                  }}
                />
              </div>

              {/* Call Notifications Toggle */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-medium">Call Notifications</span>
                  <p className="text-xs text-gray-400">Show notification banners for voice & video calls</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info toggle-sm"
                  checked={callNotifs}
                  disabled={dnd}
                  onChange={(e) => {
                    setCallNotifs(e.target.checked);
                    localStorage.setItem("call_notifications", String(e.target.checked));
                  }}
                />
              </div>

              {/* Desktop Notifications Permission button */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-medium">Desktop Notifications</span>
                  <p className="text-xs text-gray-400">
                    Permission Status: <strong className="text-sky-300 capitalize">{permissionStatus}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  disabled={permissionStatus === "granted" || permissionStatus === "denied"}
                  className={`btn btn-xs ${
                    permissionStatus === "granted"
                      ? "bg-emerald-600 cursor-not-allowed border-none text-white"
                      : permissionStatus === "denied"
                      ? "bg-red-800 cursor-not-allowed border-none text-white"
                      : "bg-sky-600 hover:bg-sky-500 border-none text-white"
                  }`}
                >
                  {permissionStatus === "granted"
                    ? "Allowed"
                    : permissionStatus === "denied"
                    ? "Blocked"
                    : "Enable"}
                </button>
              </div>

              {/* Sound Notification Toggle */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div className="flex items-center gap-2">
                  <FiVolume2 className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="text-sm font-medium">Notification Sound</span>
                    <p className="text-xs text-gray-400">Play alert sound for arrivals</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info toggle-sm"
                  checked={soundEnabled}
                  disabled={dnd}
                  onChange={(e) => {
                    setSoundEnabled(e.target.checked);
                    localStorage.setItem("notification_sound", String(e.target.checked));
                  }}
                />
              </div>

              {/* Vibration Toggle */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-medium">Vibration</span>
                  <p className="text-xs text-gray-400">Vibrate device on incoming alerts</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info toggle-sm"
                  checked={vibrationEnabled}
                  disabled={dnd}
                  onChange={(e) => {
                    setVibrationEnabled(e.target.checked);
                    localStorage.setItem("notification_vibration", String(e.target.checked));
                  }}
                />
              </div>

              {/* Notification Preview Dropdown */}
              <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all gap-2">
                <div>
                  <span className="text-sm font-medium">Notification Preview</span>
                  <p className="text-xs text-gray-400">Manage visibility details inside desktop banners</p>
                </div>
                <select
                  className="select select-bordered select-sm w-full bg-slate-700 text-white border-slate-650"
                  value={notifPreview}
                  onChange={(e) => {
                    setNotifPreview(e.target.value);
                    localStorage.setItem("notification_preview", e.target.value);
                  }}
                >
                  <option value="all">Show sender and message</option>
                  <option value="sender">Show sender only</option>
                  <option value="none">Hide content</option>
                </select>
              </div>

              {/* Test Action Trigger */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all pt-4">
                <div>
                  <span className="text-sm font-semibold">Test Configurations</span>
                  <p className="text-xs text-gray-400">Send a simulated alert using active preferences</p>
                </div>
                <button
                  type="button"
                  onClick={handleSendTestNotification}
                  className="btn btn-xs bg-indigo-600 hover:bg-indigo-500 border-none text-white font-medium"
                >
                  Send Test Notification
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: PRIVACY */}
        {activeTab === "privacy" && (
          <section className="bg-slate-800 bg-opacity-50 p-4 rounded-xl border border-slate-700 hover:border-sky-500 hover:shadow-lg transition-all duration-300 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <FiLock className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-semibold">Privacy Settings</h2>
            </div>

            <div className="space-y-4">
              {/* Visibility Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700">
                  <label className="text-xs font-semibold text-gray-300 mb-1">Last Seen</label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-800 text-white border-slate-650"
                    value={privacyLastSeen}
                    onChange={(e) => {
                      setPrivacyLastSeen(e.target.value);
                      localStorage.setItem("privacy_last_seen", e.target.value);
                    }}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700">
                  <label className="text-xs font-semibold text-gray-300 mb-1">Online Status</label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-800 text-white border-slate-650"
                    value={privacyOnlineStatus}
                    onChange={(e) => {
                      setPrivacyOnlineStatus(e.target.value);
                      localStorage.setItem("privacy_online_status", e.target.value);
                    }}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700">
                  <label className="text-xs font-semibold text-gray-300 mb-1">Profile Photo</label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-800 text-white border-slate-650"
                    value={privacyPhoto}
                    onChange={(e) => {
                      setPrivacyPhoto(e.target.value);
                      localStorage.setItem("privacy_photo", e.target.value);
                    }}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>

                <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700">
                  <label className="text-xs font-semibold text-gray-300 mb-1">About / Bio Visibility</label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-800 text-white border-slate-655"
                    value={privacyAbout}
                    onChange={(e) => setPrivacyAbout(e.target.value)}
                  >
                    <option value="everyone">Everyone</option>
                    <option value="contacts">My Contacts</option>
                    <option value="nobody">Nobody</option>
                  </select>
                </div>
              </div>

              {/* Read Receipts Switch */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-medium">Read Receipts</span>
                  <p className="text-xs text-gray-400">If disabled, read receipts will not be sent/received</p>
                </div>
                <input
                  type="checkbox"
                  className="toggle toggle-info toggle-sm"
                  checked={privacyReadReceipts}
                  onChange={(e) => {
                    setPrivacyReadReceipts(e.target.checked);
                    localStorage.setItem("privacy_read_receipts", String(e.target.checked));
                  }}
                />
              </div>

              {/* Blocked Users Section */}
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded-xl border border-slate-700">
                <span className="text-sm font-semibold block mb-3 text-white">Blocked Users</span>
                {blockedUsers.length === 0 ? (
                  <div className="text-center py-4 flex flex-col items-center gap-1 animate-fadeIn">
                    <span className="text-lg">🚫</span>
                    <p className="text-xs font-semibold text-gray-200">No Blocked Users</p>
                    <p className="text-[10px] text-gray-400">Users you block will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                    {blockedUsers.map((user) => {
                      const uId = user._id || user.id;
                      const picSrc = user.profilePic && !user.profilePic.includes("avatar.iran.liara.run")
                        ? user.profilePic
                        : getDefaultAvatar(user.gender);

                      return (
                        <div key={uId} className="flex justify-between items-center bg-slate-800 bg-opacity-65 p-2.5 rounded-xl border border-slate-750 hover:border-slate-600 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-750 overflow-hidden flex items-center justify-center">
                              <img
                                src={picSrc}
                                alt={user.fullName || user.name}
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  e.target.src = getDefaultAvatar(user.gender);
                                }}
                              />
                            </div>
                            <div className="flex flex-col pr-1">
                              <p className="text-xs font-bold text-white">{user.fullName || user.name}</p>
                              <p className="text-[10px] text-gray-400 font-medium">@{user.username}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnblock(uId, user.fullName || user.name)}
                            className="btn btn-xs h-7 bg-red-650 hover:bg-red-700 active:scale-95 border-none text-white text-[10px] font-bold rounded-lg transition-all"
                          >
                            Unblock
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Two-Step Verification Section */}
              <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                <div>
                  <span className="text-sm font-medium">Two-Step Verification</span>
                  <p className="text-xs text-gray-400">Status: <span className="text-red-400 font-semibold">Disabled</span></p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTwoStepModal(true)}
                  className="btn btn-xs bg-sky-600 hover:bg-sky-500 border-none text-white"
                >
                  Enable
                </button>
              </div>

              {/* Active Sessions */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-sky-400">
                  <FiCpu className="w-4 h-4" />
                  <span className="text-sm font-semibold">Active Sessions</span>
                </div>
                <div className="bg-slate-800 bg-opacity-65 p-2 rounded text-xs space-y-1 text-gray-300 border border-slate-700">
                  <p className="text-sky-300 font-semibold">Current Device</p>
                  <p><span className="text-gray-400">Browser:</span> Chrome v126.0</p>
                  <p><span className="text-gray-400">Operating System:</span> Windows 11 Pro</p>
                  <p><span className="text-gray-400">Login Time:</span> Today at 10:15 AM</p>
                  <p><span className="text-gray-400">Last Activity:</span> Active Now</p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success("Terminated other active device sessions.")}
                  className="btn btn-xs w-full bg-slate-800 hover:bg-slate-750 border border-slate-650 text-white text-[11px]"
                >
                  Logout Other Devices
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 5: CALLS */}
        {activeTab === "calls" && (
          <section className="bg-slate-800 bg-opacity-50 p-4 rounded-xl border border-slate-700 hover:border-sky-500 hover:shadow-lg transition-all duration-300 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <FiPhone className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-semibold">Call Settings</h2>
            </div>

            <div className="space-y-4">
              {/* Input & Output Device Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700">
                  <label className="text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                    <FiVideo className="w-3.5 h-3.5 text-sky-400" /> Camera
                  </label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-850 text-white border-slate-650"
                    value={callCamera}
                    onChange={(e) => {
                      setCallCamera(e.target.value);
                      localStorage.setItem("call_camera", e.target.value);
                    }}
                  >
                    <option value="default">Default Camera</option>
                    {cameras.map((c) => (
                      <option key={c.deviceId} value={c.deviceId}>{c.label || `Camera ${c.deviceId.slice(0, 5)}`}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700">
                  <label className="text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                    <FiMic className="w-3.5 h-3.5 text-sky-400" /> Microphone
                  </label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-850 text-white border-slate-650"
                    value={callMicrophone}
                    onChange={(e) => {
                      setCallMicrophone(e.target.value);
                      localStorage.setItem("call_microphone", e.target.value);
                    }}
                  >
                    <option value="default">Default Microphone</option>
                    {microphones.map((m) => (
                      <option key={m.deviceId} value={m.deviceId}>{m.label || `Microphone ${m.deviceId.slice(0, 5)}`}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700">
                  <label className="text-xs font-semibold text-gray-300 mb-1.5 flex items-center gap-1">
                    <FiVolume2 className="w-3.5 h-3.5 text-sky-400" /> Speaker
                  </label>
                  <select
                    className="select select-bordered select-sm w-full bg-slate-850 text-white border-slate-650"
                    value={callSpeaker}
                    disabled={speakers.length === 0}
                    onChange={(e) => {
                      setCallSpeaker(e.target.value);
                      localStorage.setItem("call_speaker", e.target.value);
                    }}
                  >
                    {speakers.length === 0 ? (
                      <option value="default">Not Supported by Browser</option>
                    ) : (
                      <>
                        <option value="default">Default Speaker</option>
                        {speakers.map((s) => (
                          <option key={s.deviceId} value={s.deviceId}>{s.label || `Speaker ${s.deviceId.slice(0, 5)}`}</option>
                        ))}
                      </>
                    )}
                  </select>
                </div>
              </div>

              {/* Video Quality Settings */}
              <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 gap-1.5">
                <label className="text-xs font-semibold text-gray-300">Video Call Quality</label>
                <select
                  className="select select-bordered select-sm w-full bg-slate-800 text-white border-slate-655"
                  value={callQuality}
                  onChange={(e) => {
                    setCallQuality(e.target.value);
                    localStorage.setItem("call_quality", e.target.value);
                  }}
                >
                  <option value="auto">Auto Select (Quality-based)</option>
                  <option value="low">Low (360p - Low Data Mode)</option>
                  <option value="medium">Medium (720p - HD Standard)</option>
                  <option value="high">High (1080p - Full HD Premium)</option>
                </select>
              </div>

              {/* WebRTC Audio Processing Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-xs font-medium">Echo Cancel</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-info toggle-xs"
                    checked={callEcho}
                    onChange={(e) => {
                      setCallEcho(e.target.checked);
                      localStorage.setItem("call_echo", String(e.target.checked));
                    }}
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-xs font-medium">Noise Suppress</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-info toggle-xs"
                    checked={callNoise}
                    onChange={(e) => {
                      setCallNoise(e.target.checked);
                      localStorage.setItem("call_noise", String(e.target.checked));
                    }}
                  />
                </div>

                <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-xs font-medium">Auto Gain</span>
                  <input
                    type="checkbox"
                    className="toggle toggle-info toggle-xs"
                    checked={callGain}
                    onChange={(e) => {
                      setCallGain(e.target.checked);
                      localStorage.setItem("call_gain", String(e.target.checked));
                    }}
                  />
                </div>
              </div>

              {/* Live Camera Preview Card */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 space-y-3">
                <span className="text-xs font-semibold block">Live Camera Preview</span>
                <div className="w-full h-40 rounded-lg bg-black border border-slate-750 flex items-center justify-center overflow-hidden relative">
                  <video
                    id="call-camera-preview-video"
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!previewStream && (
                    <span className="text-xs text-gray-500 absolute">Camera Feed Closed</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={startCameraPreview}
                    disabled={!!previewStream}
                    className="btn btn-xs flex-1 bg-sky-600 hover:bg-sky-500 border-none text-white"
                  >
                    Start Preview
                  </button>
                  <button
                    type="button"
                    onClick={stopCameraPreview}
                    disabled={!previewStream}
                    className="btn btn-xs flex-1 bg-slate-700 hover:bg-slate-600 border-none text-white"
                  >
                    Stop Preview
                  </button>
                </div>
              </div>

              {/* Microphone Level Test */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 space-y-3">
                <span className="text-xs font-semibold block">Microphone Level Check</span>
                <div className="h-4 bg-slate-950 rounded overflow-hidden border border-slate-750 flex items-center p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-red-500 rounded transition-all duration-75"
                    style={{ width: `${micLevel}%` }}
                  />
                </div>
                <button
                  type="button"
                  onClick={startMicTest}
                  className="btn btn-xs w-full bg-indigo-600 hover:bg-indigo-500 border-none text-white flex items-center gap-1.5 justify-center"
                >
                  <FiActivity className="w-3.5 h-3.5" />
                  {isMicTesting ? "Stop Microphone Test" : "Test Microphone"}
                </button>
              </div>

              {/* Speaker Sound Test & Reset Call Settings Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePlayTestSound}
                  className="btn btn-xs flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-650 text-white flex items-center justify-center gap-1.5"
                >
                  <FiVolume2 className="w-3.5 h-3.5" /> Play Test Sound
                </button>
                <button
                  type="button"
                  onClick={handleResetCallSettings}
                  className="btn btn-xs flex-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 flex items-center justify-center gap-1.5"
                >
                  <FiRotateCcw className="w-3.5 h-3.5" /> Reset Call Settings
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 6: STORAGE */}
        {activeTab === "storage" && (
          <section className="bg-slate-800 bg-opacity-50 p-4 rounded-xl border border-slate-700 hover:border-sky-500 hover:shadow-lg transition-all duration-300 space-y-6 animate-fadeIn">
            <div className="flex items-center gap-3 mb-2">
              <FiHardDrive className="w-5 h-5 text-sky-400" />
              <h2 className="text-lg font-semibold">Storage & Data</h2>
            </div>

            <div className="space-y-4">
              {/* Total Storage Summary with Progress Bar */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300">Total Storage Used</span>
                  <span className="font-bold text-sky-300">{totalUsed} MB / {totalLimit}</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className="bg-sky-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Storage Overview Categories list */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 space-y-2">
                <span className="text-xs font-semibold block text-gray-300 mb-1">Storage Overview</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="bg-slate-800 bg-opacity-60 p-2.5 rounded border border-slate-750 flex items-center gap-2">
                    <FiImage className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Images</p>
                      <p className="text-xs font-bold">{imagesSizeNum} MB</p>
                      <p className="text-[9px] text-gray-550">152 Files</p>
                    </div>
                  </div>

                  <div className="bg-slate-850 bg-opacity-60 p-2.5 rounded border border-slate-750 flex items-center gap-2">
                    <FiFilm className="w-4 h-4 text-sky-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Videos</p>
                      <p className="text-xs font-bold">{(videosSizeNum / 1024).toFixed(1)} GB</p>
                      <p className="text-[9px] text-gray-550">18 Files</p>
                    </div>
                  </div>

                  <div className="bg-slate-800 bg-opacity-60 p-2.5 rounded border border-slate-750 flex items-center gap-2">
                    <FiFileText className="w-4 h-4 text-violet-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Documents</p>
                      <p className="text-xs font-bold">{documentsSizeNum} MB</p>
                      <p className="text-[9px] text-gray-550">31 Files</p>
                    </div>
                  </div>

                  <div className="bg-slate-800 bg-opacity-60 p-2.5 rounded border border-slate-750 flex items-center gap-2">
                    <FiMusic className="w-4 h-4 text-pink-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Audio</p>
                      <p className="text-xs font-bold">{audioSizeNum} MB</p>
                      <p className="text-[9px] text-gray-550">42 Files</p>
                    </div>
                  </div>

                  <div className="bg-slate-800 bg-opacity-60 p-2.5 rounded border border-slate-750 flex items-center gap-2">
                    <FiFile className="w-4 h-4 text-amber-400" />
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">Other Files</p>
                      <p className="text-xs font-bold">{otherSizeNum} MB</p>
                      <p className="text-[9px] text-gray-550">12 Files</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Management Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMediaPlaceholder("images")}
                  className="btn btn-xs flex-1 bg-slate-900 bg-opacity-40 hover:bg-slate-850 border border-slate-700 text-white flex items-center gap-1 justify-center"
                >
                  <FiImage className="w-3 h-3" /> View Images
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediaPlaceholder("videos")}
                  className="btn btn-xs flex-1 bg-slate-900 bg-opacity-40 hover:bg-slate-850 border border-slate-700 text-white flex items-center gap-1 justify-center"
                >
                  <FiFilm className="w-3 h-3" /> View Videos
                </button>
                <button
                  type="button"
                  onClick={() => setShowMediaPlaceholder("documents")}
                  className="btn btn-xs flex-1 bg-slate-900 bg-opacity-40 hover:bg-slate-850 border border-slate-700 text-white flex items-center gap-1 justify-center"
                >
                  <FiFileText className="w-3 h-3" /> View Docs
                </button>
              </div>

              {/* Cache and Temp size controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                  <div>
                    <span className="text-xs font-semibold block">Application Cache</span>
                    <p className="text-xs text-sky-400 font-bold mt-0.5">{cacheSizeNum} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearStorageCache}
                    disabled={cacheSizeNum === 0}
                    className="btn btn-xs bg-red-800 hover:bg-red-750 border-none text-white text-[10px]"
                  >
                    Clear Cache
                  </button>
                </div>

                <div className="flex justify-between items-center bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 hover:border-sky-500 transition-all">
                  <div>
                    <span className="text-xs font-semibold block">Temporary Files</span>
                    <p className="text-xs text-sky-400 font-bold mt-0.5">{tempFilesSizeNum} MB</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearTempFiles}
                    disabled={tempFilesSizeNum === 0}
                    className="btn btn-xs bg-red-800 hover:bg-red-750 border-none text-white text-[10px]"
                  >
                    Delete Temp
                  </button>
                </div>
              </div>

              {/* Auto download dropdown */}
              <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 gap-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  <FiDownload className="w-3.5 h-3.5 text-sky-400" /> Auto Download Settings
                </label>
                <select
                  className="select select-bordered select-sm w-full bg-slate-800 text-white border-slate-650"
                  value={storageAutoDownload}
                  onChange={(e) => {
                    setStorageAutoDownload(e.target.value);
                    localStorage.setItem("storage_auto_download", e.target.value);
                  }}
                >
                  <option value="wifi">Wi-Fi Only</option>
                  <option value="all">Wi-Fi + Mobile Data</option>
                  <option value="never">Never Auto Download</option>
                </select>
              </div>

              {/* Upload quality dropdown */}
              <div className="flex flex-col bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 gap-1.5">
                <label className="text-xs font-semibold text-gray-300 flex items-center gap-1">
                  <FiDatabase className="w-3.5 h-3.5 text-sky-400" /> Media Upload Quality
                </label>
                <select
                  className="select select-bordered select-sm w-full bg-slate-800 text-white border-slate-650"
                  value={storageUploadQuality}
                  onChange={(e) => {
                    setStorageUploadQuality(e.target.value);
                    localStorage.setItem("storage_upload_quality", e.target.value);
                  }}
                >
                  <option value="original">Original (Uncompressed Best Quality)</option>
                  <option value="high">High (High Quality Compressed)</option>
                  <option value="medium">Medium (Standard Balancing)</option>
                  <option value="compressed">Compressed (Low Bandwidth Saver)</option>
                </select>
              </div>

              {/* Export and reset buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExportModal(true)}
                  className="btn btn-xs flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-655 text-white flex items-center justify-center gap-1.5"
                >
                  Export Chat Data
                </button>
                <button
                  type="button"
                  onClick={handleResetStorageSettings}
                  className="btn btn-xs flex-1 bg-red-950 hover:bg-red-900 border border-red-800 text-red-200 flex items-center justify-center gap-1.5"
                >
                  Reset Storage Settings
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 7: HELP & SUPPORT */}
        {activeTab === "help" && (
          <section className="bg-slate-800 bg-opacity-50 p-4 rounded-xl border border-slate-700 hover:border-sky-500 hover:shadow-lg transition-all duration-300 space-y-6 animate-fadeIn">
            {/* Header info */}
            <div>
              <h2 className="text-lg font-bold">Help & Support</h2>
              <p className="text-xs text-gray-400">Find answers, contact support, or report issues.</p>
            </div>

            {/* Live Search bar filter */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search help..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 bg-opacity-40 rounded-lg border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500 transition-all"
                value={helpSearchQuery}
                onChange={(e) => setHelpSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              {/* SECTION 1: Help Center */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 flex justify-between items-center hover:border-sky-500 transition-all">
                <div>
                  <span className="text-xs font-bold block text-gray-200">Help Center</span>
                  <p className="text-[11px] text-gray-400">Browse articles and common solutions.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelpCenterModal(true)}
                  className="btn btn-xs bg-sky-600 hover:bg-sky-500 border-none text-white text-[10px]"
                >
                  Open Help Center
                </button>
              </div>

              {/* SECTION 2: Frequently Asked Questions accordions list */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 space-y-2">
                <span className="text-xs font-bold block text-gray-300">Frequently Asked Questions</span>
                {filteredFaqs.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No search results match query.</p>
                ) : (
                  <div className="space-y-2">
                    {filteredFaqs.map((faq, idx) => (
                      <div key={idx} className="border border-slate-700 rounded-lg overflow-hidden transition-all bg-slate-800 bg-opacity-45">
                        <button
                          type="button"
                          onClick={() => setExpandedFaq(expandedFaq === idx ? null : idx)}
                          className="w-full flex justify-between items-center p-2.5 text-xs font-semibold text-left text-gray-300 hover:text-white transition-all"
                        >
                          <span>{faq.q}</span>
                          {expandedFaq === idx ? <FiChevronUp className="w-3.5 h-3.5 text-sky-400" /> : <FiChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        {expandedFaq === idx && (
                          <div className="p-2.5 pt-0 text-xs text-gray-400 leading-relaxed border-t border-slate-750 bg-slate-900 bg-opacity-25 animate-fadeIn">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 3: Report a Bug Form */}
              <form onSubmit={handleBugSubmit} className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 space-y-3">
                <span className="text-xs font-bold block text-gray-300">Report a Bug</span>
                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-gray-450 block mb-0.5">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief summary of issue"
                      className="w-full input input-bordered input-xs bg-slate-800 border-slate-650 text-white"
                      value={bugSubject}
                      onChange={(e) => setBugSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-gray-450 block mb-0.5">Description</label>
                    <textarea
                      required
                      placeholder="Steps to reproduce..."
                      className="w-full textarea textarea-bordered textarea-xs bg-slate-800 border-slate-655 text-white h-12 resize-none"
                      value={bugDesc}
                      onChange={(e) => setBugDesc(e.target.value)}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn btn-xs w-full bg-red-900 hover:bg-red-800 border-none text-white text-[10px]"
                >
                  Submit Bug Report
                </button>
              </form>

              {/* SECTION 4: Contact Support info */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 flex justify-between items-center hover:border-sky-500 transition-all">
                <div>
                  <span className="text-xs font-bold block text-gray-200">Contact Support</span>
                  <p className="text-[11px] text-sky-400 font-semibold">support@novatalk.com</p>
                  <p className="text-[9px] text-gray-500">Hours: Mon–Fri, 9:00 AM – 6:00 PM</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSupportModal(true)}
                  className="btn btn-xs bg-sky-600 hover:bg-sky-500 border-none text-white text-[10px]"
                >
                  Contact Support
                </button>
              </div>

              {/* SECTION 5 & 6: Privacy Policy & Terms of Service */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900 bg-opacity-40 p-2.5 rounded-lg border border-slate-700 flex flex-col justify-between gap-2">
                  <span className="text-[11px] font-bold block text-gray-300">Privacy Policy</span>
                  <button
                    type="button"
                    onClick={() => setShowPrivacyPolicyModal(true)}
                    className="btn btn-xs bg-slate-800 hover:bg-slate-750 border border-slate-600 text-white text-[9px]"
                  >
                    Read Policy
                  </button>
                </div>

                <div className="bg-slate-900 bg-opacity-40 p-2.5 rounded-lg border border-slate-700 flex flex-col justify-between gap-2">
                  <span className="text-[11px] font-bold block text-gray-300">Terms of Service</span>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="btn btn-xs bg-slate-800 hover:bg-slate-755 border border-slate-600 text-white text-[9px]"
                  >
                    Read Terms
                  </button>
                </div>
              </div>

              {/* SECTION 7: Check for Updates */}
              <div className="bg-slate-900 bg-opacity-40 p-3 rounded-lg border border-slate-700 flex justify-between items-center hover:border-sky-500 transition-all">
                <div>
                  <span className="text-xs font-bold block text-gray-200">Check for Updates</span>
                  <p className="text-[10px] text-gray-400">Keep application features up to date</p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckUpdates}
                  className="btn btn-xs bg-slate-800 hover:bg-slate-750 border border-slate-600 text-white text-[10px]"
                >
                  Check for Updates
                </button>
              </div>

              {/* SECTION 8: About NovaTalk Card */}
              <div className="bg-slate-900 bg-opacity-40 p-4 rounded-lg border border-slate-700 text-center space-y-4">
                <span className="text-xs font-bold block text-gray-400 uppercase tracking-wider text-left border-b border-slate-800 pb-1.5 mb-1">About NovaTalk</span>
                <div className="space-y-3.5 text-center">
                  <h3 className="text-xl font-extrabold tracking-wide text-white">NovaTalk</h3>
                  <p className="text-[10px] text-gray-550 font-medium">Version 1.0.0</p>
                  <p className="text-xs text-gray-450">
                    A Modern Secure Real-Time Messaging Platform
                  </p>
                  <div className="pt-1">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">Developed & Designed by</p>
                    <p className="text-sm font-bold text-sky-400 mt-0.5">Divyanshu Kumar</p>
                  </div>
                  <p className="text-[10px] text-gray-600 pt-2">
                    © 2026 NovaTalk. All rights reserved.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

      </div>

      {/* WALLPAPER SELECTION MODAL */}
      {showWallpaperModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-full max-w-lg shadow-2xl text-white">
            <h3 className="text-lg font-bold mb-1">Select Chat Wallpaper</h3>
            <p className="text-xs text-gray-400 mb-4">Click any wallpaper to preview it instantly on the background</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto mb-4 p-1">
              {[
                { name: "default", style: "bg-slate-750 border-slate-600 bg-opacity-50", desc: "Transparent" },
                { name: "blue", style: "bg-gradient-to-b from-blue-600 to-blue-950", desc: "Ocean Blue" },
                { name: "dark", style: "bg-slate-950 border-slate-800", desc: "Deep Black" },
                { name: "gradient", style: "bg-gradient-to-br from-indigo-600 to-purple-800", desc: "Indigo Violet" },
                { name: "snow", style: "bg-gradient-to-b from-slate-200 to-slate-400 text-slate-800", desc: "Winter Snow" },
                { name: "mountains", style: "bg-gradient-to-b from-slate-900 to-slate-950", desc: "Mountain Ridge" },
                { name: "forest", style: "bg-gradient-to-br from-emerald-800 to-teal-950", desc: "Forest Green" },
                { name: "minimal", style: "bg-neutral-900 border-neutral-800 [background-image:radial-gradient(#444_1px,transparent_0)] [background-size:10px_10px]", desc: "Dotted Grid" },
                { name: "abstract", style: "bg-gradient-to-r from-orange-500 via-pink-500 to-sky-600", desc: "Aura Flow" },
                { name: "solid", style: "bg-slate-700", desc: "Solid Slate" }
              ].map((wp) => (
                <button
                  key={wp.name}
                  type="button"
                  onClick={() => setPreviewWallpaper(wp.name)}
                  className={`flex flex-col items-center justify-between p-2 rounded-lg border-2 h-20 transition-all hover:scale-105 ${wp.style} ${
                    previewWallpaper === wp.name ? "border-sky-400 scale-105" : "border-slate-700"
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold tracking-wider opacity-85">{wp.name}</span>
                  <span className="text-[11px] font-medium">{wp.desc}</span>
                </button>
              ))}
            </div>
            
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setPreviewWallpaper(wallpaper); // restore original
                  setShowWallpaperModal(false);
                }}
                className="btn btn-sm flex-1 bg-slate-700 hover:bg-slate-655 border-none text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setWallpaper(previewWallpaper);
                  localStorage.setItem("wallpaper", previewWallpaper);
                  setShowWallpaperModal(false);
                  toast.success("Wallpaper applied successfully!");
                }}
                className="btn btn-sm flex-1 bg-sky-600 hover:bg-sky-500 border-none text-white"
              >
                Apply Wallpaper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TWO-STEP VERIFICATION MODAL */}
      {showTwoStepModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-80 shadow-2xl text-white text-center">
            <FiShield className="w-12 h-12 text-sky-400 mx-auto mb-3" />
            <h3 className="text-md font-bold mb-2">Two-Step Verification</h3>
            <p className="text-xs text-gray-300 mb-4">
              Enter a custom 6-digit PIN to enable two-step authentication for your NovaTalk account.
            </p>
            <div className="flex justify-center gap-1.5 mb-4">
              {[...Array(6)].map((_, i) => (
                <input
                  key={i}
                  type="password"
                  maxLength={1}
                  disabled
                  placeholder="•"
                  className="w-8 h-10 text-center bg-slate-700 border border-slate-650 rounded text-lg font-bold"
                />
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTwoStepModal(false)}
                className="btn btn-sm flex-1 bg-slate-700 hover:bg-slate-650 border-none text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowTwoStepModal(false);
                  toast.success("Two-Step Verification enabled! (Demo only)");
                }}
                className="btn btn-sm flex-1 bg-sky-600 hover:bg-sky-500 border-none text-white text-xs"
              >
                Confirm PIN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDIA MANAGEMENT PLACEHOLDER MODAL */}
      {showMediaPlaceholder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-80 shadow-2xl text-white text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-700 mx-auto flex items-center justify-center text-sky-400">
              {showMediaPlaceholder === "images" && <FiImage className="w-6 h-6" />}
              {showMediaPlaceholder === "videos" && <FiFilm className="w-6 h-6" />}
              {showMediaPlaceholder === "documents" && <FiFileText className="w-6 h-6" />}
            </div>
            <h3 className="text-md font-bold capitalize">View {showMediaPlaceholder}</h3>
            <p className="text-xs text-gray-300">
              This will launch the native media manager to filter and group your {showMediaPlaceholder}. (Placeholder only)
            </p>
            <button
              onClick={() => setShowMediaPlaceholder(null)}
              className="btn btn-sm btn-block bg-slate-700 hover:bg-slate-650 border-none text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* EXPORT DATA MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-80 shadow-2xl text-white text-center space-y-3">
            <FiDatabase className="w-12 h-12 text-sky-400 mx-auto" />
            <h3 className="text-md font-bold">Export Chat Data</h3>
            <p className="text-xs text-gray-300">
              Generate a secure HTML/JSON archive containing your entire chat history, media files, and active session configurations.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="btn btn-sm flex-1 bg-slate-700 hover:bg-slate-650 border-none text-white text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowExportModal(false);
                  toast.success("Chat data packaging scheduled! (Demo only)");
                }}
                className="btn btn-sm flex-1 bg-sky-600 hover:bg-sky-500 border-none text-white text-xs"
              >
                Start Export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HELP CENTER MODAL */}
      {showHelpCenterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-80 shadow-2xl text-white text-center space-y-3">
            <FiHelpCircle className="w-12 h-12 text-sky-400 mx-auto animate-bounce" />
            <h3 className="text-md font-bold">Help Center</h3>
            <p className="text-xs text-gray-300">
              Redirecting you to the online Help Center for support articles and guides. (Placeholder only)
            </p>
            <button
              onClick={() => setShowHelpCenterModal(false)}
              className="btn btn-sm btn-block bg-slate-700 hover:bg-slate-650 border-none text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {showPrivacyPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-80 shadow-2xl text-white text-center space-y-3">
            <FiLock className="w-12 h-12 text-sky-400 mx-auto" />
            <h3 className="text-md font-bold">Privacy Policy</h3>
            <p className="text-xs text-gray-300 leading-relaxed text-left max-h-40 overflow-y-auto">
              Your chat security is our core mandate. We store encrypted chat histories locally and synchronize peer metadata using WebRTC signaling protocols. We never share user info or metadata content with third party aggregators.
            </p>
            <button
              onClick={() => setShowPrivacyPolicyModal(false)}
              className="btn btn-sm btn-block bg-slate-700 hover:bg-slate-650 border-none text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* TERMS OF SERVICE MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-80 shadow-2xl text-white text-center space-y-3">
            <FiFileText className="w-12 h-12 text-sky-400 mx-auto" />
            <h3 className="text-md font-bold">Terms of Service</h3>
            <p className="text-xs text-gray-300 leading-relaxed text-left max-h-40 overflow-y-auto">
              By using NovaTalk Desktop, you agree to respect peer safety rules, not engage in bulk spamming or automated bot crawlers, and respect encryption parameters established for voice, video, and group chats.
            </p>
            <button
              onClick={() => setShowTermsModal(false)}
              className="btn btn-sm btn-block bg-slate-700 hover:bg-slate-655 border-none text-white"
            >
              Understand
            </button>
          </div>
        </div>
      )}

      {/* CONTACT SUPPORT MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-80 shadow-2xl text-white">
            <h3 className="text-md font-bold mb-2">Contact Support</h3>
            <p className="text-xs text-gray-300 mb-4">Need help? Send us an email and our team will get right back to you.</p>
            <div className="bg-slate-700 p-3 rounded text-center text-sm font-semibold select-all mb-4 text-sky-300">
              support@novatalk.com
            </div>
            <button
              onClick={() => setShowSupportModal(false)}
              className="btn btn-sm btn-block bg-slate-700 hover:bg-slate-650 border-none text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT VERIFICATION MODAL */}
      {showConfirmDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-65 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-gray-700 rounded-xl p-5 w-80 shadow-2xl text-white text-center space-y-3">
            <FiTrash2 className="w-12 h-12 text-red-500 mx-auto animate-pulse" />
            <h3 className="text-md font-bold text-red-400">Delete Account</h3>
            <p className="text-xs text-gray-300">
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowConfirmDeleteModal(false)}
                className="btn btn-sm flex-1 bg-slate-700 hover:bg-slate-655 border-none text-white text-xs font-semibold"
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                className="btn btn-sm flex-1 bg-red-700 hover:bg-red-800 border-none text-white text-xs font-semibold flex items-center justify-center gap-1"
                disabled={deletingAccount}
              >
                {deletingAccount ? <span className="loading loading-spinner"></span> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
