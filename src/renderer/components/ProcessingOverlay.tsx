export function ProcessingOverlay() {
  return (
    <div className="absolute inset-0 bg-[#1C1917]/60 backdrop-blur-sm flex flex-col items-center justify-center z-40">
      <div className="flex gap-1.5 mb-3">
        {[0, 1, 2].map(i => (
          <div key={i}
            className="w-2 h-2 rounded-full bg-[#4A7FA0] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      <p className="text-xs text-white/50">Structuring your prompt...</p>
    </div>
  );
}
