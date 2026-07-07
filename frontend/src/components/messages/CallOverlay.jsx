import { useCallContext } from "../../context/CallContext";
import { BsMicMuteFill, BsMicFill, BsTelephoneFill, BsTelephoneXFill } from "react-icons/bs";

const DEFAULT_AVATAR_GENERIC = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a0aec0'><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/></svg>";

const CallOverlay = () => {
  const {
    incomingCall,
    outgoingCall,
    activeCall,
    isMuted,
    callDuration,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
  } = useCallContext();

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // 1. Incoming Call Dialog
  if (incomingCall) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
        <div className="bg-gray-800 border border-gray-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-6 animate-bounce-short">
          <span className="text-sky-400 font-semibold tracking-wider text-xs uppercase animate-pulse">Incoming Voice Call</span>
          
          <div className="avatar">
            <div className="w-24 h-24 rounded-full ring-4 ring-sky-500 ring-offset-4 ring-offset-gray-800 bg-gray-700 flex items-center justify-center overflow-hidden">
              <img
                src={incomingCall.callerAvatar || DEFAULT_AVATAR_GENERIC}
                alt={incomingCall.callerName}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="text-center">
            <h4 className="text-xl font-bold text-white tracking-wide">{incomingCall.callerName}</h4>
            <p className="text-sm text-gray-400 mt-1">is calling you...</p>
          </div>

          <div className="flex gap-8 mt-2 w-full justify-center">
            <button
              onClick={rejectCall}
              className="btn btn-circle bg-red-500 hover:bg-red-600 border-none text-white w-14 h-14 shadow-lg hover:scale-105 transition-all"
              title="Reject Call"
            >
              <BsTelephoneXFill size={20} />
            </button>
            <button
              onClick={acceptCall}
              className="btn btn-circle bg-green-500 hover:bg-green-600 border-none text-white w-14 h-14 shadow-lg hover:scale-105 transition-all animate-pulse"
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
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/90 backdrop-blur-lg p-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <span className="text-sky-400 font-semibold tracking-wider text-xs uppercase animate-pulse">Calling...</span>

          <div className="avatar">
            <div className="w-32 h-32 rounded-full ring-4 ring-sky-500 ring-offset-4 ring-offset-gray-950 bg-gray-700 flex items-center justify-center overflow-hidden">
              <img
                src={outgoingCall.receiverAvatar || DEFAULT_AVATAR_GENERIC}
                alt={outgoingCall.receiverName}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="text-center">
            <h4 className="text-2xl font-bold text-white tracking-wide">{outgoingCall.receiverName}</h4>
            <p className="text-sm text-gray-400 mt-2">Connecting peer connection...</p>
          </div>

          <div className="mt-8">
            <button
              onClick={endCall}
              className="btn btn-circle bg-red-500 hover:bg-red-600 border-none text-white w-16 h-16 shadow-xl hover:scale-105 transition-all"
              title="End Call"
            >
              <BsTelephoneXFill size={24} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Call Screen
  if (activeCall) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gray-950/90 backdrop-blur-lg p-4">
        <div className="w-full max-w-sm flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-1">
            <span className="text-green-400 font-semibold tracking-wider text-xs uppercase">Call Connected</span>
            <span className="text-xl font-semibold text-gray-300 font-mono tracking-wider mt-1">{formatTime(callDuration)}</span>
          </div>

          <div className="avatar">
            <div className="w-32 h-32 rounded-full ring-4 ring-green-500 ring-offset-4 ring-offset-gray-950 bg-gray-700 flex items-center justify-center overflow-hidden">
              <img
                src={activeCall.partnerAvatar || DEFAULT_AVATAR_GENERIC}
                alt={activeCall.partnerName}
                className="object-cover w-full h-full"
              />
            </div>
          </div>

          <div className="text-center">
            <h4 className="text-2xl font-bold text-white tracking-wide">{activeCall.partnerName}</h4>
          </div>

          <div className="flex gap-8 mt-6">
            <button
              onClick={toggleMute}
              className={`btn btn-circle border-none text-white w-14 h-14 shadow-lg hover:scale-105 transition-all ${
                isMuted ? "bg-gray-600 hover:bg-gray-500" : "bg-sky-500 hover:bg-sky-600"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <BsMicMuteFill size={20} /> : <BsMicFill size={20} />}
            </button>
            <button
              onClick={endCall}
              className="btn btn-circle bg-red-500 hover:bg-red-600 border-none text-white w-14 h-14 shadow-lg hover:scale-105 transition-all"
              title="End Call"
            >
              <BsTelephoneXFill size={20} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default CallOverlay;
