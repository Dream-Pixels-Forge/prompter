export function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 bg-surface/70 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-[12px]">
      {/* Animated rings */}
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-t-accent/60 animate-spin" />
        <div className="absolute inset-3 rounded-full bg-accent/10 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-accent" />
        </div>
      </div>
      <p className="text-xs text-white/68 font-medium">Structuring your prompt...</p>
      <p className="text-[10px] text-white/48 mt-1">Applying framework + template</p>
    </div>
  );
}
