export default function HRLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto p-4 sm:p-6 text-gray-900">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-56 rounded-lg bg-gray-200" />
          <div className="h-4 w-80 rounded-lg bg-gray-200" />
        </div>
        <div className="h-9 w-32 rounded-xl bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="h-28 rounded-2xl bg-gray-200" />
        <div className="h-28 rounded-2xl bg-gray-200" />
        <div className="h-28 rounded-2xl bg-gray-200" />
      </div>

      <div className="h-96 rounded-2xl bg-gray-200" />
    </div>
  );
}
