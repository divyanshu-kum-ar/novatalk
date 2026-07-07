import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSocketContext } from "./SocketContext";
import { useAuthContext } from "./AuthContext";
import useConversation from "../zustand/useConversation";
import toast from "react-hot-toast";

const CallContext = createContext();

export const useCallContext = () => useContext(CallContext);

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const CallContextProvider = ({ children }) => {
  const { socket } = useSocketContext();
  const { authUser } = useAuthContext();

  const [incomingCall, setIncomingCall] = useState(null);
  const [outgoingCall, setOutgoingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const timerRef = useRef(null);
  const pendingIceCandidates = useRef([]);

  // Refs to prevent closure race conditions
  const incomingCallRef = useRef(incomingCall);
  const outgoingCallRef = useRef(outgoingCall);
  const activeCallRef = useRef(activeCall);
  const callDurationRef = useRef(callDuration);

  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

  useEffect(() => {
    outgoingCallRef.current = outgoingCall;
  }, [outgoingCall]);

  useEffect(() => {
    activeCallRef.current = activeCall;
  }, [activeCall]);

  useEffect(() => {
    callDurationRef.current = callDuration;
  }, [callDuration]);

  // Save call log in database
  const saveCallLog = async (receiverId, type, duration) => {
    try {
      const res = await fetch("/api/messages/call-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receiverId, type, duration }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Append new message to store if the active conversation is with the partner
      const state = useConversation.getState();
      if (state.selectedConversation && state.selectedConversation._id === receiverId) {
        state.setMessages([...state.messages, data]);
      }
    } catch (err) {
      console.error("Error saving call log:", err);
    }
  };

  // Reset all call states
  const resetCallState = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    pendingIceCandidates.current = [];
    setIncomingCall(null);
    setOutgoingCall(null);
    setActiveCall(null);
    setIsMuted(false);
    setCallDuration(0);
  };

  // Start call
  const startCall = async (receiverId, receiverName, receiverAvatar) => {
    if (incomingCallRef.current || outgoingCallRef.current || activeCallRef.current) {
      toast.error("You are already in a call or have a pending call");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      setOutgoingCall({
        to: receiverId,
        receiverName,
        receiverAvatar,
      });

      console.log("[CLIENT] startCall emitting voice-call:", {
        receiverId,
        callerName: authUser.fullName,
        socketId: socket?.id,
      });

      socket?.emit("voice-call", {
        userToCall: receiverId,
        callerName: authUser.fullName,
        callerAvatar: authUser.profilePic,
      });
    } catch (err) {
      toast.error("Microphone access is required to make voice calls.");
      resetCallState();
    }
  };

  // Accept Call
  const acceptCall = async () => {
    const currentIncoming = incomingCallRef.current;
    if (!currentIncoming) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      setActiveCall({
        partnerId: currentIncoming.from,
        partnerName: currentIncoming.callerName,
        partnerAvatar: currentIncoming.callerAvatar,
        isCaller: false,
      });
      setIncomingCall(null);

      socket?.emit("accept-call", { to: currentIncoming.from });
      startDurationTimer();
    } catch (err) {
      toast.error("Microphone access is required to accept voice calls.");
      socket?.emit("reject-call", { to: currentIncoming.from });
      resetCallState();
    }
  };

  // Reject Call
  const rejectCall = () => {
    const currentIncoming = incomingCallRef.current;
    if (!currentIncoming) return;
    socket?.emit("reject-call", { to: currentIncoming.from });
    resetCallState();
  };

  // End Call
  const endCall = () => {
    const currentActive = activeCallRef.current;
    const currentOutgoing = outgoingCallRef.current;
    const currentIncoming = incomingCallRef.current;

    const partnerId = currentActive?.partnerId || currentOutgoing?.to || currentIncoming?.from;
    
    // Save call log on caller side
    if (currentActive && currentActive.isCaller) {
      saveCallLog(currentActive.partnerId, "completed", callDurationRef.current);
    } else if (currentOutgoing) {
      saveCallLog(currentOutgoing.to, "missed", 0);
    }

    if (partnerId) {
      socket?.emit("end-call", { to: partnerId });
    }
    resetCallState();
  };

  // Toggle Mute
  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Timer
  const startDurationTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCallDuration(0);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Initialize peer connection
  const createPeerConnection = (partnerId) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket?.emit("ice-candidate", { to: partnerId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed" || pc.connectionState === "closed") {
        resetCallState();
      }
    };

    pc.ontrack = (event) => {
      if (!remoteAudioRef.current) {
        const audio = document.createElement("audio");
        audio.autoplay = true;
        remoteAudioRef.current = audio;
      }
      remoteAudioRef.current.srcObject = event.streams[0];
    };

    return pc;
  };

  // Listeners bound once
  useEffect(() => {
    if (!socket) return;

    socket.on("voice-call", ({ from, callerName, callerAvatar }) => {
      console.log("[CLIENT] received voice-call event:", { from, callerName, callerAvatar });
      if (incomingCallRef.current || outgoingCallRef.current || activeCallRef.current) {
        console.log("[CLIENT] already in call, rejecting:", from);
        socket.emit("reject-call", { to: from });
        return;
      }
      setIncomingCall({ from, callerName, callerAvatar });
    });

    socket.on("accept-call", async ({ from }) => {
      console.log("[CLIENT] received accept-call from:", from);
      const currentOutgoing = outgoingCallRef.current;
      if (!currentOutgoing) return;

      setActiveCall({
        partnerId: currentOutgoing.to,
        partnerName: currentOutgoing.receiverName,
        partnerAvatar: currentOutgoing.receiverAvatar,
        isCaller: true,
      });
      setOutgoingCall(null);
      startDurationTimer();

      const pc = createPeerConnection(from);
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("[CLIENT] emitting webrtc-offer to:", from);
        socket.emit("webrtc-offer", { to: from, offer });
      } catch (err) {
        console.error("Error creating WebRTC Offer:", err);
        endCall();
      }
    });

    socket.on("reject-call", () => {
      console.log("[CLIENT] received reject-call");
      toast.error("Call rejected or busy");
      
      const currentOutgoing = outgoingCallRef.current;
      if (currentOutgoing) {
        saveCallLog(currentOutgoing.to, "missed", 0);
      }
      
      resetCallState();
    });

    socket.on("webrtc-offer", async ({ offer, from }) => {
      console.log("[CLIENT] received webrtc-offer from:", from);
      const pc = createPeerConnection(from);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("[CLIENT] emitting webrtc-answer to:", from);
        socket.emit("webrtc-answer", { to: from, answer });

        while (pendingIceCandidates.current.length > 0) {
          const candidate = pendingIceCandidates.current.shift();
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      } catch (err) {
        console.error("Error handling WebRTC Offer:", err);
        endCall();
      }
    });

    socket.on("webrtc-answer", async ({ answer }) => {
      console.log("[CLIENT] received webrtc-answer");
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
          
          while (pendingIceCandidates.current.length > 0) {
            const candidate = pendingIceCandidates.current.shift();
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
        } catch (err) {
          console.error("Error setting Remote Description answer:", err);
          endCall();
        }
      }
    });

    socket.on("ice-candidate", async ({ candidate }) => {
      console.log("[CLIENT] received ice-candidate");
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        try {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Error adding ICE Candidate:", err);
        }
      } else {
        pendingIceCandidates.current.push(candidate);
      }
    });

    socket.on("end-call", () => {
      console.log("[CLIENT] received end-call");
      const currentActive = activeCallRef.current;
      if (currentActive && currentActive.isCaller) {
        saveCallLog(currentActive.partnerId, "completed", callDurationRef.current);
      }
      resetCallState();
    });

    return () => {
      socket.off("voice-call");
      socket.off("accept-call");
      socket.off("reject-call");
      socket.off("webrtc-offer");
      socket.off("webrtc-answer");
      socket.off("ice-candidate");
      socket.off("end-call");
    };
  }, [socket]);

  return (
    <CallContext.Provider
      value={{
        incomingCall,
        outgoingCall,
        activeCall,
        isMuted,
        callDuration,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
