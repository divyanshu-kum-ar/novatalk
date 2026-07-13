import React from "react";

export const ChatListSkeleton = () => {
  return (
    <div className="space-y-3 p-2 w-full">
      {[...Array(5)].map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 w-full p-2.5 rounded-2xl bg-slate-950/20 border border-white/5 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-slate-800 shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-800 rounded-lg w-1/3"></div>
            <div className="h-2.5 bg-slate-850 rounded-lg w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const MessageBubbleSkeleton = () => {
  return (
    <div className="space-y-4 p-4 w-full">
      <div className="flex gap-2.5 items-start max-w-[70%] animate-pulse">
        <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0"></div>
        <div className="space-y-1.5 flex-1">
          <div className="h-2.5 bg-slate-800 rounded w-24"></div>
          <div className="p-3 bg-slate-950/30 rounded-2xl rounded-tl-none border border-white/5">
            <div className="h-3 bg-slate-800 rounded w-48 mb-2"></div>
            <div className="h-2.5 bg-slate-850 rounded w-32"></div>
          </div>
        </div>
      </div>
      <div className="flex gap-2.5 items-start justify-end max-w-[70%] ml-auto animate-pulse">
        <div className="space-y-1.5 flex-grow text-right">
          <div className="p-3 bg-slate-950/30 rounded-2xl rounded-tr-none border border-white/5 inline-block text-left">
            <div className="h-3 bg-slate-800 rounded w-52 mb-2"></div>
            <div className="h-2.5 bg-slate-850 rounded w-24"></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-800 shrink-0"></div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-4 p-4 w-full max-w-md mx-auto animate-pulse bg-slate-950/35 rounded-3xl border border-white/5">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-slate-850"></div>
        <div className="h-3.5 bg-slate-800 rounded w-1/3"></div>
        <div className="h-2.5 bg-slate-850 rounded w-1/4"></div>
      </div>
      <div className="space-y-3 pt-2">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="h-2.5 bg-slate-850 rounded w-16"></div>
            <div className="h-8 bg-slate-900 rounded-xl w-full border border-white/5"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SettingsSkeleton = () => {
  return (
    <div className="flex w-full h-full animate-pulse">
      <div className="w-48 bg-slate-950/40 border-r border-white/5 p-3 space-y-2">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="h-6 bg-slate-850 rounded-xl w-full"></div>
        ))}
      </div>
      <div className="flex-grow p-5 space-y-4">
        <div className="h-4 bg-slate-800 rounded w-1/4"></div>
        <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-white/5">
          <div className="h-8 bg-slate-950 rounded-xl w-full"></div>
          <div className="h-8 bg-slate-950 rounded-xl w-full"></div>
          <div className="h-8 bg-slate-950 rounded-xl w-full"></div>
        </div>
      </div>
    </div>
  );
};

export const GroupListSkeleton = () => {
  return (
    <div className="space-y-3 w-full">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 w-full p-2.5 rounded-2xl bg-slate-950/20 animate-pulse border border-white/5">
          <div className="w-9 h-9 rounded-full bg-slate-800 shrink-0"></div>
          <div className="flex-grow space-y-1.5">
            <div className="h-3 bg-slate-800 rounded w-1/2"></div>
            <div className="h-2.5 bg-slate-850 rounded w-24"></div>
          </div>
          <div className="w-12 h-5 bg-slate-800 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
};

export const SearchResultsSkeleton = () => {
  return (
    <div className="space-y-2.5 p-3 w-full">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="p-3 bg-slate-950/25 rounded-2xl border border-white/5 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <div className="h-3 bg-slate-800 rounded w-24"></div>
            <div className="h-2.5 bg-slate-850 rounded w-12"></div>
          </div>
          <div className="h-3 bg-slate-850 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};

export const MediaGallerySkeleton = () => {
  return (
    <div className="grid grid-cols-3 gap-2 p-2 w-full animate-pulse">
      {[...Array(6)].map((_, idx) => (
        <div key={idx} className="aspect-square bg-slate-850 rounded-xl border border-white/5"></div>
      ))}
    </div>
  );
};
