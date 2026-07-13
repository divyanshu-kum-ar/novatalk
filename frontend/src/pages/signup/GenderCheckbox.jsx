const GenderCheckbox = ({ onCheckboxChange, selectedGender }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <span className="text-[10px] font-bold text-gray-450 tracking-wider uppercase mr-1">Gender:</span>
      <button
        type="button"
        onClick={() => onCheckboxChange("male")}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-native ${
          selectedGender === "male"
            ? "bg-sky-500/20 border-sky-500 text-sky-400 shadow-md"
            : "bg-slate-950/40 border-slate-800 text-gray-400 hover:text-white hover:bg-slate-850"
        }`}
      >
        Male
      </button>
      <button
        type="button"
        onClick={() => onCheckboxChange("female")}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-native ${
          selectedGender === "female"
            ? "bg-sky-500/20 border-sky-500 text-sky-400 shadow-md"
            : "bg-slate-950/40 border-slate-800 text-gray-400 hover:text-white hover:bg-slate-850"
        }`}
      >
        Female
      </button>
    </div>
  );
};
export default GenderCheckbox;
