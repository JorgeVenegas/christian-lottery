
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
    const [lockedCardIds, setLockedCardIds] = useState(new Set<number>());
    const [winningSequenceStart, setWinningSequenceStart] = useState<number | null>(null);

    // Algorithm to lock cards and ensure only one winner
    const calculateLockedCards = (totalCards: number): Set<number> => {
        const locked = new Set<number>();

        // Step 1: Select random number from 0 to 24
        const randomNum = Math.floor(Math.random() * 10000000 % 25); // 0 to 24

        // Step 2: Set winning sequence (the 16 cards between the locks)
        const winningStart = randomNum; // First card after initial lock
        const safetySecondWinnerStart = winningStart - 1;
        const secondSafetySecondWinnerStart = winningStart - 2;
        const thridSafetySecondWinnerStart = winningStart - 3;
        const winningEnd = winningStart + 17; // Last card of 16-card sequence
        const safetyThirdWinnerEnd = winningEnd + 1;
        const secondSafetyThirdWinnerEnd = winningEnd + 2;
        const thirdSafetyThirdWinnerEnd = winningEnd + 3;
        setWinningSequenceStart(winningStart);


        // Step 3: Lock initial cards based on the random number
        if (winningStart > 0) {
            // Lock the card that corresponds to the number (1 = lock card 1, etc)
            locked.add(winningStart);
        } else {
            locked.add(thirdSafetyThirdWinnerEnd);
        }

        // Lock the card immediately before it (if applicable)
        if (safetySecondWinnerStart > 0) {
            locked.add(safetySecondWinnerStart);
        } else {
            locked.add(secondSafetyThirdWinnerEnd);
        }

        // Lock the card 17 steps ahead
        if (winningEnd <= totalCards) {
            locked.add(winningEnd);
        } else {
            locked.add(thridSafetySecondWinnerStart)
        }


        if (safetyThirdWinnerEnd <= totalCards) {
            locked.add(safetyThirdWinnerEnd);
        } else {
            locked.add(secondSafetySecondWinnerStart);
        }

        // Step 4: Lock cards 16 steps before start and 16 steps after end
        const lockBeforeStart = safetySecondWinnerStart - 16;
        if (lockBeforeStart >= 1) {
            locked.add(lockBeforeStart);
        }

        const lockAfterEnd = safetyThirdWinnerEnd + 16;
        if (lockAfterEnd <= totalCards) {
            locked.add(lockAfterEnd);
        }

        return locked;
    };

    // Check if current viewed cards form the winning sequence
    const checkForWinner = (viewedSet: Set<number>) => {
        if (!winningSequenceStart || viewedSet.size < 16) return false;

        // Get the original IDs of viewed cards
        const viewedOriginalIds = Array.from(viewedSet).map(index => items[index].id).sort((a, b) => a - b);

        // Check if the winning sequence is complete
        let hasWinningSequence = true;
        for (let i = 0; i < 16; i++) {
            if (!viewedOriginalIds.includes(winningSequenceStart + i)) {
                hasWinningSequence = false;
                break;
            }
        }

        return hasWinningSequence;
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

                // Calculate and set locked cards after items are loaded
                const locked = calculateLockedCards(data.length);
                setLockedCardIds(locked);

                if (shuffledData.length > 0) {
                    setViewedIndices(new Set([0]));
                }
            }
            setLoading(false);
        };

        fetchItems();
    }, []);

    const goToNextItem = () => {
        let newIndex = (currentItemIndex + 1) % items.length;

        // Skip locked cards
        while (lockedCardIds.has(items[newIndex].id)) {
            newIndex = (newIndex + 1) % items.length;
        }

        setCurrentItemIndex(newIndex);
        const newViewedIndices = new Set(viewedIndices).add(newIndex);
        setViewedIndices(newViewedIndices);

        // Check for winner
        if (checkForWinner(newViewedIndices)) {
            // Winner found! You can add celebration logic here
            console.log(`Winner! Sequence starting from card #${winningSequenceStart}`);
        }
    };

    const goToPreviousItem = () => {
        let newIndex = (currentItemIndex - 1 + items.length) % items.length;

        // Skip locked cards
        while (lockedCardIds.has(items[newIndex].id)) {
            newIndex = (newIndex - 1 + items.length) % items.length;
        }

        setCurrentItemIndex(newIndex);
        const newViewedIndices = new Set(viewedIndices).add(newIndex);
        setViewedIndices(newViewedIndices);

        // Check for winner
        if (checkForWinner(newViewedIndices)) {
            // Winner found! You can add celebration logic here
            console.log(`Winner! Sequence starting from card #${winningSequenceStart}`);
        }
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

            {/* Temporary Debug UI - Shows locked cards and winning sequence */}
            {winningSequenceStart && (
                <div className="w-full bg-black/80 text-white p-4 z-20 border-b-2 border-yellow-400">
                    <div className="max-w-7xl mx-auto">
                        <h3 className="text-lg font-bold mb-2 text-yellow-400">DEBUG INFO:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-green-400">Winning Sequence:</span>
                                <span className="ml-2">Cards {winningSequenceStart} to {winningSequenceStart + 15}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-red-400">Locked Cards:</span>
                                <span className="ml-2">[{Array.from(lockedCardIds).sort((a, b) => a - b).join(', ')}]</span>
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
                    {[...items].sort((a, b) => a.id - b.id).map((item) => {
                        const originalIndex = items.findIndex(originalItem => originalItem.id === item.id);
                        const isLocked = lockedCardIds.has(item.id);
                        return (
                            <div key={item.id} className="relative w-full h-full">
                                <img
                                    src={item.image_url}
                                    alt=""
                                    className={`w-full h-full object-contain rounded-md transition-all duration-300 ${isLocked ? 'opacity-30 grayscale blur-sm' :
                                        viewedIndices.has(originalIndex) ? 'opacity-50 saturate-0' : 'opacity-100'
                                        } ${originalIndex === currentItemIndex ? 'ring-4 ring-yellow-300 scale-110 shadow-xl' : ''
                                        } ${!isLocked ? 'hover:scale-105' : ''}`}
                                />
                                {isLocked && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </footer>
        </div>
    );
}
