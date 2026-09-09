export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="text-center">
        <h1 className="mb-2 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Rehber bulunamadı
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Bu kullanıcı yok ya da rehberi herkese açık değil.
        </p>
      </div>
    </div>
  );
}
