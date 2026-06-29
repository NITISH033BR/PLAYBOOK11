import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-6xl font-bold text-[#6b7280]">404</h2>
      <p className="text-[#6b7280]">Page not found</p>
      <Link href="/" className="btn-primary">
        Go Home
      </Link>
    </div>
  );
}
