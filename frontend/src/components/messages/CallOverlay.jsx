import { useCallContext } from "../../context/CallContext";
import { BsMicMuteFill, BsMicFill, BsTelephoneFill, BsTelephoneXFill, BsCameraVideoFill, BsCameraVideoOffFill } from "react-icons/bs";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const CallOverlay = () => {
  const {
    incomingCall,
    outgoingCall,
    activeCall,
    isMuted,
    isCameraOff,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleCamera,
    localVideoRef,
    remoteVideoRef,
  } = useCallContext();

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 1. Incoming Call Screen
  if (incomingCall) {
    const isVideo = incomingCall.isVideo;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/85 backdrop-blur-xl p-6">
        <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700/50 w-full max-w-sm rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-7 select-none animate-fade-in">
          <span className="text-blue-400 font-bold tracking-widest text-xs uppercase animate-pulse">
            Incoming {isVideo ? "Video" : "Voice"} Call
          </span>
          
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute w-28 h-28 rounded-full bg-blue-500/10 animate-ping [animation-duration:1.5s]"></div>
            <div className="absolute w-32 h-32 rounded-full bg-blue-500/5 animate-pulse [animation-duration:1s]"></div>
            <div className="w-24 h-24 rounded-full ring-4 ring-blue-600 ring-offset-4 ring-offset-gray-800 bg-gray-700 flex items-center justify-center overflow-hidden z-10 shadow-lg">
              <img
                src={incomingCall.callerAvatar || DEFAULT_AVATAR_GENERIC}
                alt={incomingCall.callerName}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="text-center">
            <h4 className="text-2xl font-bold text-white tracking-wide">{incomingCall.callerName}</h4>
            <p className="text-sm text-gray-400 mt-1.5 font-medium">is calling you...</p>
          </div>

          <div className="flex gap-8 mt-2 w-full justify-center">
            <button
              onClick={rejectCall}
              className="btn btn-circle bg-red-500 hover:bg-red-600 border-none text-white w-14 h-14 shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              title="Reject Call"
            >
              <BsTelephoneXFill size={20} />
            </button>
            <button
              onClick={acceptCall}
              className="btn btn-circle bg-green-500 hover:bg-green-600 border-none text-white w-14 h-14 shadow-lg hover:scale-105 active:scale-95 transition-all animate-bounce flex items-center justify-center"
              title="Accept Call"
            >
              <BsTelephoneFill size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Outgoing Call Screen
  if (outgoingCall) {
    const isVideo = outgoingCall.isVideo;
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-tr from-gray-950 via-gray-900 to-gray-950 backdrop-blur-xl p-6">
        <div className="w-full max-w-sm flex flex-col items-center gap-9 select-none animate-fade-in">
          <span className="text-blue-400 font-bold tracking-widest text-xs uppercase animate-pulse">
            Calling ({isVideo ? "Video" : "Voice"})...
          </span>

          <div className="relative flex items-center justify-center my-3">
            <div className="absolute w-36 h-36 rounded-full bg-blue-500/10 animate-ping [animation-duration:2s]"></div>
            <div className="absolute w-40 h-40 rounded-full bg-blue-500/5 animate-pulse [animation-duration:1s]"></div>
            <div className="w-32 h-32 rounded-full ring-4 ring-blue-600 ring-offset-4 ring-offset-gray-950 bg-gray-700 flex items-center justify-center overflow-hidden z-10 shadow-xl">
              <img
                src={outgoingCall.receiverAvatar || DEFAULT_AVATAR_GENERIC}
                alt={outgoingCall.receiverName}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="text-center">
            <h4 className="text-3xl font-extrabold text-white tracking-wide">{outgoingCall.receiverName}</h4>
            <p className="text-sm text-gray-400 mt-2 font-medium">Connecting...</p>
          </div>

          <div className="mt-8">
            <button
              onClick={endCall}
              className="btn btn-circle bg-red-500 hover:bg-red-600 border-none text-white w-16 h-16 shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
              title="End Call"
            >
              <BsTelephoneXFill size={22} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Call Screen
  if (activeCall) {
    const isVideo = activeCall.isVideo;
    const isConnected = callDuration > 0;
    const statusText = isConnected ? "Connected" : "Connecting...";

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 backdrop-blur-xl p-6">
        {isVideo ? (
          // Video Call Layout
          <div className="relative w-full h-full max-w-4xl bg-gray-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-gray-800 animate-fade-in">
            {/* Remote Video Stream (Main view) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover absolute inset-0"
            />

            {/* Local Video Stream (Miniature overlay) */}
            <div className="absolute top-4 right-4 w-28 sm:w-36 h-36 sm:h-48 rounded-2xl overflow-hidden border border-white/20 shadow-2xl z-20 bg-black animate-fade-in">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            </div>

            {/* Top Toolbar overlay (Timer & Status) */}
            <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md px-4.5 py-2 rounded-full flex items-center gap-2.5 border border-white/10 shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-500" : "bg-yellow-500"} animate-pulse`}></span>
              <span className="text-xs font-bold text-white tracking-widest font-mono">{formatTime(callDuration)}</span>
              <span className="text-gray-500 text-xs font-medium">|</span>
              <span className="text-xs text-gray-300 font-semibold truncate max-w-[120px]">{activeCall.partnerName}</span>
            </div>

            {/* Bottom Controls Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-6 bg-black/65 backdrop-blur-lg p-4.5 rounded-full border border-white/10 shadow-2xl items-center">
              <button
                onClick={toggleCamera}
                className={`btn btn-circle border-none text-white w-12 h-12 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                  isCameraOff ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-500"
                }`}
                title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isCameraOff ? <BsCameraVideoOffFill size={18} /> : <BsCameraVideoFill size={18} />}
              </button>

              <button
                onClick={toggleMute}
                className={`btn btn-circle border-none text-white w-12 h-12 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                  isMuted ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-500"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <BsMicMuteFill size={18} /> : <BsMicFill size={18} />}
              </button>

              <button
                onClick={endCall}
                className="btn btn-circle bg-red-600 hover:bg-red-700 border-none text-white w-12 h-12 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                title="End Call"
              >
                <BsTelephoneXFill size={18} />
              </button>
            </div>
          </div>
        ) : (
          // Voice Call Layout (Redesigned with premium aesthetics)
          <div className="w-full max-w-sm flex flex-col items-center gap-9 select-none animate-fade-in">
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-blue-400 font-bold tracking-widest text-xs uppercase">{statusText}</span>
              <span className="text-2xl font-extrabold text-white font-mono tracking-widest mt-1">{formatTime(callDuration)}</span>
            </div>

            <div className="relative flex items-center justify-center my-3">
              <div className="absolute w-36 h-36 rounded-full bg-blue-500/10 animate-pulse [animation-duration:2s]"></div>
              <div className="w-32 h-32 rounded-full ring-4 ring-blue-600 ring-offset-4 ring-offset-gray-950 bg-gray-700 flex items-center justify-center overflow-hidden z-10 shadow-xl">
                <img
                  src={activeCall.partnerAvatar || DEFAULT_AVATAR_GENERIC}
                  alt={activeCall.partnerName}
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            <div className="text-center">
              <h4 className="text-3xl font-extrabold text-white tracking-wide">{activeCall.partnerName}</h4>
            </div>

            <div className="flex gap-7 mt-8">
              <button
                onClick={toggleMute}
                className={`btn btn-circle border-none text-white w-13 h-13 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${
                  isMuted ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-500"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <BsMicMuteFill size={18} /> : <BsMicFill size={18} />}
              </button>
              <button
                onClick={endCall}
                className="btn btn-circle bg-red-600 hover:bg-red-700 border-none text-white w-13 h-13 shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center"
                title="End Call"
              >
                <BsTelephoneXFill size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default CallOverlay;
