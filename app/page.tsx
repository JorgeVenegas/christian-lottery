
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
    const [cardOrder, setCardOrder] = useState<number[]>([]);
    const [orderIndex, setOrderIndex] = useState(0);
    const [isImageVisible, setIsImageVisible] = useState(false);
    const [isNavigating, setIsNavigating] = useState(false);

    // Create the predetermined card order
    const createCardOrder = (totalCards: number, winningStart: number, lockedCards: Set<number>): number[] => {
        // Create winning sequence array (16 cards) and shuffle them
        const winningCards: number[] = [];
        for (let i = 0; i < 16; i++) {
            winningCards.push(winningStart + i);
        }

        // Filter out locked cards from winning cards for the main order
        const unlockedWinningCards = winningCards.filter(card => !lockedCards.has(card));
        // Shuffle winning cards so they don't appear in sequential order
        const shuffledWinningCards = [...unlockedWinningCards].sort(() => Math.random() - 0.5);

        // Create non-winning cards array (all cards except winning and locked)
        const nonWinningCards: number[] = [];
        for (let i = 1; i <= totalCards; i++) {
            if (!winningCards.includes(i) && !lockedCards.has(i)) {
                nonWinningCards.push(i);
            }
        }
        // Shuffle non-winning cards
        const shuffledNonWinning = [...nonWinningCards].sort(() => Math.random() - 0.5);

        // Create perfectly interleaved order
        const finalOrder: number[] = [];
        const totalNonWinning = shuffledNonWinning.length;
        const totalWinning = shuffledWinningCards.length;

        // Only proceed with interleaving if we have winning cards to interleave
        if (totalWinning > 0) {
            // Calculate the interval between winning cards
            const interval = Math.floor(totalNonWinning / totalWinning);

            let nonWinningIndex = 0;
            let winningIndex = 0;

            // Interleave cards: for every `interval` non-winning cards, add 1 winning card
            while (nonWinningIndex < totalNonWinning || winningIndex < totalWinning) {
                // Add non-winning cards
                for (let i = 0; i < interval && nonWinningIndex < totalNonWinning; i++) {
                    finalOrder.push(shuffledNonWinning[nonWinningIndex]);
                    nonWinningIndex++;
                }

                // Add one winning card
                if (winningIndex < totalWinning) {
                    finalOrder.push(shuffledWinningCards[winningIndex]);
                    winningIndex++;
                }
            }

            // Add any remaining non-winning cards
            while (nonWinningIndex < totalNonWinning) {
                finalOrder.push(shuffledNonWinning[nonWinningIndex]);
                nonWinningIndex++;
            }

            // Ensure the last card is always from the winning sequence (if we have unlocked winning cards)
            if (finalOrder.length > 0) {
                const lastCard = finalOrder[finalOrder.length - 1];
                if (!shuffledWinningCards.includes(lastCard)) {
                    // If the last card is not a winning card, swap it with the last winning card in the array
                    const lastWinningCardIndex = finalOrder.lastIndexOf(shuffledWinningCards[shuffledWinningCards.length - 1]);
                    if (lastWinningCardIndex !== -1) {
                        // Swap the positions
                        finalOrder[lastWinningCardIndex] = lastCard;
                        finalOrder[finalOrder.length - 1] = shuffledWinningCards[shuffledWinningCards.length - 1];
                    }
                }
            }
        } else {
            // If no unlocked winning cards, just add all non-winning cards
            finalOrder.push(...shuffledNonWinning);
        }

        // Add unlocked cards at the end in priority order
        const unlockedCards: number[] = [];

        // Calculate all the special positions
        const winningEnd = winningStart + 17;
        const safetySecondWinnerStart = winningStart - 1;
        const safetyThirdWinnerEnd = winningEnd + 1;
        const secondSafetySecondWinnerStart = winningStart - 2;
        const secondSafetyThirdWinnerEnd = winningEnd + 2;
        const thirdSafetySecondWinnerStart = winningStart - 3;
        const thirdSafetyThirdWinnerEnd = winningEnd + 3;

        // Priority 1: winningStart and winningEnd (if they exist and are locked)
        if (winningStart >= 1 && winningStart <= totalCards && lockedCards.has(winningStart)) {
            unlockedCards.push(winningStart);
        }
        if (winningEnd >= 1 && winningEnd <= totalCards && lockedCards.has(winningEnd)) {
            unlockedCards.push(winningEnd);
        }

        // Priority 2: safetySecondWinnerStart and safetyThirdWinnerEnd
        if (safetySecondWinnerStart >= 1 && safetySecondWinnerStart <= totalCards && lockedCards.has(safetySecondWinnerStart)) {
            unlockedCards.push(safetySecondWinnerStart);
        }
        if (safetyThirdWinnerEnd >= 1 && safetyThirdWinnerEnd <= totalCards && lockedCards.has(safetyThirdWinnerEnd)) {
            unlockedCards.push(safetyThirdWinnerEnd);
        }

        // Priority 3: secondSafetySecondWinnerStart and secondSafetyThirdWinnerEnd
        if (secondSafetySecondWinnerStart >= 1 && secondSafetySecondWinnerStart <= totalCards && lockedCards.has(secondSafetySecondWinnerStart)) {
            unlockedCards.push(secondSafetySecondWinnerStart);
        }
        if (secondSafetyThirdWinnerEnd >= 1 && secondSafetyThirdWinnerEnd <= totalCards && lockedCards.has(secondSafetyThirdWinnerEnd)) {
            unlockedCards.push(secondSafetyThirdWinnerEnd);
        }

        // Priority 4: thirdSafetySecondWinnerStart and thirdSafetyThirdWinnerEnd
        if (thirdSafetySecondWinnerStart >= 1 && thirdSafetySecondWinnerStart <= totalCards && lockedCards.has(thirdSafetySecondWinnerStart)) {
            unlockedCards.push(thirdSafetySecondWinnerStart);
        }
        if (thirdSafetyThirdWinnerEnd >= 1 && thirdSafetyThirdWinnerEnd <= totalCards && lockedCards.has(thirdSafetyThirdWinnerEnd)) {
            unlockedCards.push(thirdSafetyThirdWinnerEnd);
        }

        // Add any remaining locked cards that weren't covered above
        Array.from(lockedCards).forEach(cardId => {
            if (!unlockedCards.includes(cardId) && cardId >= 1 && cardId <= totalCards) {
                unlockedCards.push(cardId);
            }
        });

        // Add all unlocked cards to the final order
        finalOrder.push(...unlockedCards);

        return finalOrder;
    };

    // Function to restart the game
    const restartGame = () => {
        // Reset all state
        setCurrentItemIndex(0);
        setViewedIndices(new Set());
        setWinningSequenceStart(null);
        setCardOrder([]);
        setOrderIndex(0);
        setIsImageVisible(false);
        setIsNavigating(false);

        // Recalculate locked cards and trigger re-initialization
        if (items.length > 0) {
            const locked = calculateLockedCards(items.length);
            setLockedCardIds(locked);
            // The useEffect will handle the rest of the initialization
        }
    };

    // Algorithm to lock cards and ensure only one winner
    const calculateLockedCards = (totalCards: number): Set<number> => {
        const locked = new Set<number>();

        // Step 1: Select random number from 0 to 24
        const randomNum = Math.floor(Math.random() * 10000000 % 25); // 0 to 24

        // Step 2: Set winning sequence (the 16 cards between the locks)
        const winningStart = randomNum; // First card after initial lock
        const safetySecondWinnerStart = winningStart - 1;
        const secondSafetySecondWinnerStart = winningStart - 2;
        const thirdSafetySecondWinnerStart = winningStart - 3;
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
            locked.add(thirdSafetySecondWinnerStart);
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

        // First, check if all non-winning cards have been viewed
        const winningCardIds = new Set();
        for (let i = 0; i < 16; i++) {
            winningCardIds.add(winningSequenceStart + i);
        }

        // Get all card IDs that are NOT part of the winning sequence and NOT locked
        const nonWinningUnlockedCardIds = items
            .filter(item => !winningCardIds.has(item.id) && !lockedCardIds.has(item.id))
            .map(item => item.id);

        // Check if all non-winning, unlocked cards have been viewed
        const allNonWinningViewed = nonWinningUnlockedCardIds.every(cardId =>
            viewedOriginalIds.includes(cardId)
        );

        // Only allow winning if all non-winning cards have been viewed first
        if (!allNonWinningViewed) {
            return false;
        }

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
            }
            setLoading(false);
        };

        fetchItems();
    }, []);

    // Separate useEffect to handle card order creation after winningSequenceStart is set
    useEffect(() => {
        if (items.length > 0 && winningSequenceStart !== null && lockedCardIds.size > 0) {
            // Create the predetermined card order
            const order = createCardOrder(items.length, winningSequenceStart, lockedCardIds);
            setCardOrder(order);

            // Set the first item based on our predetermined order
            const firstCardId = order[0];
            const firstItemIndex = items.findIndex(item => item.id === firstCardId);
            if (firstItemIndex !== -1) {
                setCurrentItemIndex(firstItemIndex);
                setViewedIndices(new Set([firstItemIndex]));
                setOrderIndex(0);
                setIsImageVisible(true); // Show first image immediately
            }
        }
    }, [items, winningSequenceStart, lockedCardIds]);

    // Handle image animation delay
    useEffect(() => {
        if (!isNavigating) return;

        setIsImageVisible(false);

        const timer = setTimeout(() => {
            setIsImageVisible(true);
            setIsNavigating(false);
        }, 3000);

        return () => clearTimeout(timer);
    }, [currentItemIndex, isNavigating]);

    const goToNextItem = () => {
        if (orderIndex >= cardOrder.length - 1 || isNavigating) {
            // We've reached the end of our predetermined order or currently navigating
            return;
        }

        // First blur the current image, then change to new card
        setIsImageVisible(false);
        setIsNavigating(true);

        // Small delay to ensure blur effect is applied before changing the image
        setTimeout(() => {
            const nextOrderIndex = orderIndex + 1;
            const nextCardId = cardOrder[nextOrderIndex];

            // Find the item with this ID
            const nextItemIndex = items.findIndex(item => item.id === nextCardId);

            if (nextItemIndex !== -1) {
                setCurrentItemIndex(nextItemIndex);
                setOrderIndex(nextOrderIndex);
                const newViewedIndices = new Set(viewedIndices).add(nextItemIndex);
                setViewedIndices(newViewedIndices);

                // Check for winner
                if (checkForWinner(newViewedIndices)) {
                    console.log(`Winner! Sequence starting from card #${winningSequenceStart}`);
                }
            }
        }, 100); // Short delay to ensure blur is applied first
    };

    const goToPreviousItem = () => {
        if (orderIndex <= 0 || isNavigating) {
            // We're at the beginning or currently navigating
            return;
        }

        // First blur the current image, then change to new card
        setIsImageVisible(false);
        setIsNavigating(true);

        // Small delay to ensure blur effect is applied before changing the image
        setTimeout(() => {
            const prevOrderIndex = orderIndex - 1;
            const prevCardId = cardOrder[prevOrderIndex];

            // Find the item with this ID
            const prevItemIndex = items.findIndex(item => item.id === prevCardId);

            if (prevItemIndex !== -1) {
                setCurrentItemIndex(prevItemIndex);
                setOrderIndex(prevOrderIndex);
                // Note: We don't remove from viewedIndices when going back
                const newViewedIndices = new Set(viewedIndices).add(prevItemIndex);
                setViewedIndices(newViewedIndices);

                // Check for winner (though going backwards shouldn't trigger a win)
                if (checkForWinner(newViewedIndices)) {
                    console.log(`Winner! Sequence starting from card #${winningSequenceStart}`);
                }
            }
        }, 100); // Short delay to ensure blur is applied first
    }; if (loading) {
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
                        <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider">Lotería Bíblica</h1>
                    </div>
                    <div className='flex items-center gap-4'>
                        <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full border-2 border-white">
                            <div className="w-4 h-4 bg-yellow-300 rounded-full"></div>
                            <span className="text-lg font-black text-white">{viewedIndices.size}/{items.length}</span>
                        </div>
                        <button
                            onClick={restartGame}
                            className="bg-white/20 text-lg hover:bg-white/30 px-4 py-2 rounded-full border-2 border-white text-white font-bold transition-all duration-200"
                        >
                            🔄 Restart
                        </button>
                    </div>
                </div>
            </header>

            {/* Temporary Debug UI - Shows locked cards and winning sequence */}
            {/* {winningSequenceStart && cardOrder.length > 0 && (
                <div className="w-full bg-black/80 text-white p-4 z-20 border-b-2 border-yellow-400">
                    <div className="max-w-7xl mx-auto">
                        <h3 className="text-lg font-bold mb-2 text-yellow-400">DEBUG INFO:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="font-semibold text-green-400">Winning Sequence:</span>
                                <span className="ml-2">Cards {winningSequenceStart} to {winningSequenceStart + 15}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-red-400">Locked Cards:</span>
                                <span className="ml-2">[{Array.from(lockedCardIds).sort((a, b) => a - b).join(', ')}]</span>
                            </div>
                            <div>
                                <span className="font-semibold text-blue-400">Order Progress:</span>
                                <span className="ml-2">{orderIndex + 1}/{cardOrder.length} cards</span>
                            </div>
                            <div>
                                <span className="font-semibold text-purple-400">Current Card ID:</span>
                                <span className="ml-2">#{currentItem?.id}</span>
                            </div>
                        </div>
                        <div className="mt-2">
                            <span className="font-semibold text-orange-400">Card Order:</span>
                            <span className="ml-2 text-xs">[{cardOrder.join(', ')}]</span>
                        </div>
                    </div>
                </div>
            )} */}

            <main className="flex-grow flex flex-row items-center justify-center p-4 gap-6 overflow-hidden max-h-[calc(100vh-200px)] z-10">
                {/* Back Button */}
                <button
                    onClick={goToPreviousItem}
                    disabled={orderIndex <= 0 || isNavigating}
                    className={`w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-2xl shadow-lg hover:scale-110 transform transition-all duration-200 border-3 border-white flex items-center justify-center flex-shrink-0 active:scale-95 ${(orderIndex <= 0 || isNavigating) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Main Content Area */}
                <div className="flex flex-row gap-8 max-w-6xl flex-grow max-h-[70vh] items-center">
                    {/* Image */}
                    <div className="flex items-center justify-center relative">
                        <img
                            src={currentItem.image_url}
                            alt={currentItem.description}
                            className={`max-h-[60vh] object-contain rounded-3xl shadow-xl border-4 border-white transition-all duration-500 ${isImageVisible ? 'blur-none opacity-100' : 'blur-3xl opacity-60'
                                }`}
                        />
                        {!isImageVisible && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl animate-pulse border-4 border-white">
                                    <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description - Main Actor - Always visible */}
                    <div className="flex-1 bg-gradient-to-br from-purple-400 to-violet-500 rounded-3xl shadow-2xl border-6 border-white p-8 flex flex-col items-center justify-center text-center transform hover:scale-105 transition-all duration-300">
                        <p className="text-3xl text-white font-black drop-shadow-lg leading-tight uppercase tracking-wide text-center">{currentItem.description}</p>
                    </div>
                </div>

                {/* Forward Button */}
                <button
                    onClick={goToNextItem}
                    disabled={orderIndex >= cardOrder.length - 1 || isNavigating}
                    className={`w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 text-white rounded-2xl shadow-lg transform transition-all duration-200 border-3 border-white flex items-center justify-center flex-shrink-0 active:scale-95 ${(orderIndex >= cardOrder.length - 1 || isNavigating) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                        }`}
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
                        return (
                            <div key={item.id} className="relative w-full h-full">
                                <img
                                    src={item.image_url}
                                    alt=""
                                    className={`w-full h-full object-contain rounded-md transition-all duration-300 
                                        ${viewedIndices.has(originalIndex) ? 'opacity-50 saturate-0' : 'opacity-100'}
                                        ${originalIndex === currentItemIndex ? 'ring-4 ring-yellow-300 scale-110 shadow-xl' : ''
                                        }`}
                                />
                            </div>
                        );
                    })}
                </div>
            </footer>
        </div>
    );
}
