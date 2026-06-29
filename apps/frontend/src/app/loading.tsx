export default function Loading() {
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
        <p className="text-sm text-[#6b7280]">Loading...</p>
      </div>
    </div>
  );
}
