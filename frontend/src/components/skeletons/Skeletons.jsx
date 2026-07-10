import React from "react";

export const ChatListSkeleton = () => {
  return (
    <div className="space-y-3 p-2 w-full">
      {[...Array(5)].map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 w-full p-2 rounded-lg bg-slate-900 bg-opacity-20 animate-pulse">
          <div className="w-10 h-10 rounded-full bg-slate-700 shrink-0"></div>
          <div className="flex-1 space-y-2">
            <div className="h-3.5 bg-slate-750 rounded w-1/3"></div>
            <div className="h-3 bg-slate-700 rounded w-2/3"></div>
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
        <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0"></div>
        <div className="space-y-1.5 flex-1">
          <div className="h-3 bg-slate-700 rounded w-24"></div>
          <div className="p-3 bg-slate-900 bg-opacity-30 rounded-2xl rounded-tl-none border border-slate-750">
            <div className="h-3.5 bg-slate-750 rounded w-48 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-32"></div>
          </div>
        </div>
      </div>
      <div className="flex gap-2.5 items-start justify-end max-w-[70%] ml-auto animate-pulse">
        <div className="space-y-1.5 flex-grow text-right">
          <div className="p-3 bg-slate-900 bg-opacity-30 rounded-2xl rounded-tr-none border border-slate-750 inline-block text-left">
            <div className="h-3.5 bg-slate-750 rounded w-52 mb-2"></div>
            <div className="h-3 bg-slate-700 rounded w-24"></div>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0"></div>
      </div>
    </div>
  );
};

export const ProfileSkeleton = () => {
  return (
    <div className="space-y-4 p-4 w-full max-w-md mx-auto animate-pulse bg-slate-900 bg-opacity-25 rounded-xl border border-slate-750">
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full bg-slate-700"></div>
        <div className="h-4 bg-slate-700 rounded w-1/3"></div>
        <div className="h-3 bg-slate-750 rounded w-1/4"></div>
      </div>
      <div className="space-y-3 pt-2">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="h-3 bg-slate-750 rounded w-16"></div>
            <div className="h-8 bg-slate-800 rounded w-full border border-slate-700"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const SettingsSkeleton = () => {
  return (
    <div className="flex w-full h-full animate-pulse">
      <div className="w-48 bg-slate-900 bg-opacity-40 border-r border-slate-750 p-3 space-y-2">
        {[...Array(5)].map((_, idx) => (
          <div key={idx} className="h-6 bg-slate-750 rounded w-full"></div>
        ))}
      </div>
      <div className="flex-1 p-5 space-y-4">
        <div className="h-4 bg-slate-700 rounded w-1/4"></div>
        <div className="space-y-3 bg-slate-850 p-4 rounded-xl border border-slate-750">
          <div className="h-8 bg-slate-850 rounded w-full"></div>
          <div className="h-8 bg-slate-850 rounded w-full"></div>
          <div className="h-8 bg-slate-850 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
};

export const GroupListSkeleton = () => {
  return (
    <div className="space-y-3 w-full">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="flex items-center gap-3 w-full p-2.5 rounded-lg bg-slate-900 bg-opacity-20 animate-pulse border border-slate-750">
          <div className="w-9 h-9 rounded-full bg-slate-700 shrink-0"></div>
          <div className="flex-grow space-y-1.5">
            <div className="h-3.5 bg-slate-750 rounded w-1/2"></div>
            <div className="h-2.5 bg-slate-700 rounded w-24"></div>
          </div>
          <div className="w-12 h-5 bg-slate-700 rounded"></div>
        </div>
      ))}
    </div>
  );
};

export const SearchResultsSkeleton = () => {
  return (
    <div className="space-y-2.5 p-3 w-full">
      {[...Array(3)].map((_, idx) => (
        <div key={idx} className="p-3 bg-slate-900 bg-opacity-25 rounded-lg border border-slate-750 animate-pulse">
          <div className="flex justify-between items-center mb-2">
            <div className="h-3 bg-slate-700 rounded w-24"></div>
            <div className="h-2.5 bg-slate-750 rounded w-12"></div>
          </div>
          <div className="h-3 bg-slate-750 rounded w-full"></div>
        </div>
      ))}
    </div>
  );
};

export const MediaGallerySkeleton = () => {
  return (
    <div className="grid grid-cols-3 gap-2 p-2 w-full animate-pulse">
      {[...Array(6)].map((_, idx) => (
        <div key={idx} className="aspect-square bg-slate-700 rounded-lg border border-slate-750"></div>
      ))}
    </div>
  );
};
