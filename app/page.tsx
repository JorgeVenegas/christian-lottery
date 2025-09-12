import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative bg-cover bg-center" style={{ backgroundImage: 'url(/opengraph-image.png)' }}>
      <div className="absolute inset-0 bg-black/60 z-0" />
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full min-h-screen">
        <h1 className="text-6xl font-extrabold text-white drop-shadow-lg mb-6 text-center">Christian Lottery</h1>
        <Link href="/game" className="mb-8 px-8 py-4 bg-yellow-400 text-black font-bold rounded-lg shadow-lg hover:bg-yellow-500 transition-all text-2xl">Start Playing</Link>
      </div>
    </main>
  );
}
