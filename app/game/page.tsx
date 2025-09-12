
'use client'
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

// Define the type for our lottery item
interface LotteryItem {
  id: number;
  image_url: string;
  description: string;
}

export default function GamePage() {
  const [items, setItems] = useState<LotteryItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewedIndices, setViewedIndices] = useState(new Set<number>());
  const [winners, setWinners] = useState<number[]>([]);

  // Function to check for 16 consecutive cards based on original IDs (only among viewed cards)
  const checkForWinner = (viewedSet: Set<number>) => {
    if (items.length === 0 || viewedSet.size < 16) return;
    
    // Get the original IDs of viewed cards only
    const viewedOriginalIds = Array.from(viewedSet).map(index => items[index].id).sort((a, b) => a - b);
    
    // Check if we have exactly 16 consecutive IDs among the viewed cards
    for (let i = 0; i <= viewedOriginalIds.length - 16; i++) {
      const startId = viewedOriginalIds[i];
      let consecutiveCount = 1;
      
      // Count how many consecutive cards we have starting from this position
      for (let j = i + 1; j < viewedOriginalIds.length; j++) {
        if (viewedOriginalIds[j] === viewedOriginalIds[j-1] + 1) {
          consecutiveCount++;
          if (consecutiveCount === 16 && !winners.includes(startId)) {
            setWinners(prev => [...prev, startId]);
            return; // Found a winner, stop checking
          }
        } else {
          break; // Not consecutive anymore
        }
      }
    }
  };

  useEffect(() => {
    const fetchItems = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('lottery_items')
        .select('id, image_url, description');

      if (error) {
        setError(error.message);
      } else if (data) {
        const shuffledData = data.sort(() => Math.random() - 0.5);
        setItems(shuffledData);
        if (shuffledData.length > 0) {
          setViewedIndices(new Set([0]));
        }
      }
      setLoading(false);
    };

    fetchItems();
  }, []);

  const goToNextItem = () => {
    const newIndex = (currentItemIndex + 1) % items.length;
    setCurrentItemIndex(newIndex);
    const newViewedIndices = new Set(viewedIndices).add(newIndex);
    setViewedIndices(newViewedIndices);
    checkForWinner(newViewedIndices);
  };

  const goToPreviousItem = () => {
    const newIndex = (currentItemIndex - 1 + items.length) % items.length;
    setCurrentItemIndex(newIndex);
    const newViewedIndices = new Set(viewedIndices).add(newIndex);
    setViewedIndices(newViewedIndices);
    checkForWinner(newViewedIndices);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen">Error: {error}</div>;
  }

  if (items.length === 0) {
    return <div className="flex items-center justify-center min-h-screen">No items found.</div>;
  }

  const currentItem = items[currentItemIndex];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-emerald-300 via-teal-300 to-cyan-300 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-10 left-10 w-20 h-20 bg-orange-400 rounded-full animate-bounce shadow-lg"></div>
        <div className="absolute top-1/4 right-16 w-16 h-16 bg-pink-400 rounded-2xl animate-pulse shadow-lg"></div>
        <div className="absolute bottom-32 left-1/4 w-24 h-24 bg-purple-400 rounded-full animate-bounce delay-100 shadow-lg"></div>
        <div className="absolute top-1/2 left-3/4 w-12 h-12 bg-yellow-400 rounded-2xl animate-pulse delay-300 shadow-lg"></div>
        <div className="absolute bottom-20 right-20 w-18 h-18 bg-red-400 rounded-full animate-bounce delay-500 shadow-lg"></div>
      </div>
      
      {/* Header Bar */}
      <header className="w-full bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 p-3 shadow-lg z-20 border-b-4 border-white">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider">LOTERÍA CRISTIANA</h1>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border-2 border-white">
            <div className="w-4 h-4 bg-yellow-300 rounded-full"></div>
            <span className="text-lg font-black text-white">{viewedIndices.size}/{items.length}</span>
          </div>
        </div>
      </header>

      {/* Winner Announcement */}
      {winners.length > 0 && (
        <div className="w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-4 shadow-lg z-20 border-b-4 border-white animate-pulse">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-bounce">
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-black text-white tracking-wider">¡LOTERÍA!</h2>
                <p className="text-xl text-white font-bold">
                  Winner detected! Series starting from card #{winners[winners.length - 1]}
                </p>
              </div>
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center animate-bounce delay-100">
                <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-row items-center justify-center p-4 gap-6 overflow-hidden max-h-[calc(100vh-200px)] z-10">
        {/* Back Button */}
        <button
          onClick={goToPreviousItem}
          className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl shadow-lg hover:scale-110 transform transition-all duration-200 border-3 border-white flex items-center justify-center flex-shrink-0 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Main Content Area */}
        <div className="flex flex-row gap-8 max-w-6xl flex-grow max-h-[70vh] items-center">
          {/* Image */}
          <div className="flex items-center justify-center">
            <img src={currentItem.image_url} alt={currentItem.description} className="max-h-[60vh] object-contain rounded-3xl shadow-xl border-4 border-white" />
          </div>
          
          {/* Description - Main Actor */}
          <div className="flex-1 bg-gradient-to-br from-purple-400 to-violet-500 rounded-3xl shadow-2xl border-6 border-white p-8 flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all duration-300">
            <p className="text-3xl text-white font-black drop-shadow-lg leading-tight uppercase tracking-wide text-center">{currentItem.description}</p>
          </div>
        </div>
        
        {/* Forward Button */}
        <button
          onClick={goToNextItem}
          className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-2xl shadow-lg hover:scale-110 transform transition-all duration-200 border-3 border-white flex items-center justify-center flex-shrink-0 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </main>

      {/* Bottom Panel: All Cards Grid */}
      <footer className="w-full bg-gradient-to-r from-red-400 to-orange-500 p-4 shadow-lg h-auto z-10 border-t-4 border-white">
        <div 
          className="gap-4 h-full max-w-7xl mx-auto"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(20, 1fr)',
            gridAutoRows: 'minmax(0, 1fr)'
          }}
        >
          {[...items].sort((a, b) => a.id - b.id).map((item, sortedIndex) => {
            const originalIndex = items.findIndex(originalItem => originalItem.id === item.id);
            return (
              <img
                key={item.id}
                src={item.image_url}
                alt=""
                className={`w-full h-full object-contain rounded-md transition-all duration-300 ${
                  viewedIndices.has(originalIndex) ? 'opacity-50 saturate-0' : 'opacity-100'
                } ${
                  originalIndex === currentItemIndex ? 'ring-4 ring-yellow-300 scale-110 shadow-xl' : ''
                } hover:scale-105`}
              />
            );
          })}
        </div>
      </footer>
    </div>
  );
}
