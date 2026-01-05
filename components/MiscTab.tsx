import * as React from 'react';
import { useState, ChangeEvent } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { PaparazziPhoto, PaparazziPhotoCategory } from '../types';
import { db } from '../db/db';
import BookOpenIcon from './icons/BookOpenIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const MiscTab: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { date } = gameState;
    const [showEndCareerConfirm, setShowEndCareerConfirm] = useState(false);
    const [showExportOptions, setShowExportOptions] = useState(false);
    
    // State for paparazzi photos
    const [paparazziImage, setPaparazziImage] = useState<string | null>(null);
    const [paparazziCategory, setPaparazziCategory] = useState<PaparazziPhotoCategory>('Spotted');

    if (!activeArtist || !activeArtistData) {
        return null;
    }

    const unreadCount = activeArtistData.inbox.filter(e => !e.isRead).length;
    
    const handleInboxClick = () => {
        dispatch({ type: 'CHANGE_VIEW', payload: 'inbox' });
    };

    const handleEndCareer = async () => {
        await db.saves.clear();
        window.location.reload(); // Hard reset
    };
    
    const handleExport = () => {
        if (!activeArtist) {
            alert('Cannot export, no active artist.');
            return;
        }
        try {
            const artistName = activeArtist.name.replace(/\s/g, '_');
            const dateStr = `${gameState.date.year}-W${gameState.date.week}`;
            
            const fileContent = JSON.stringify(gameState, null, 2);
            const mimeType = 'application/json';
            const fileName = `red-mic-save_${artistName}_${dateStr}.json`;

            // Fix: Use globalThis.Blob to avoid potential shadowing issues with @google/genai or other libraries
            const blob = new globalThis.Blob([fileContent], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Failed to export save data:", err);
            alert('Error exporting data. Please check the console.');
        }
        setShowExportOptions(false);
    };

    const handleImageUpload = (e: ChangeEvent<HTMLInputElement>, setter: (value: string | null) => void) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleMultipleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            files.forEach(file => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    dispatch({ type: 'ADD_ARTIST_IMAGE', payload: reader.result as string });
                };
                // Fix: Ensure the argument passed to readAsDataURL is recognized as a Blob/File
                reader.readAsDataURL(file as Blob);
            });
        }
    };

    return (
        <div className="p-4 space-y-6">
            <h2 className="text-3xl font-bold text-red-500">Misc</h2>

            <div className="space-y-3">
                <button 
                    onClick={handleInboxClick}
                    className="w-full bg-zinc-800 p-4 rounded-lg text-left flex justify-between items-center hover:bg-zinc-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <span className="text-lg font-bold">Inbox</span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-4 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-zinc-800">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-500" />
                </button>

                <button 
                    onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'gameGuide' })}
                    className="w-full bg-zinc-800 p-4 rounded-lg text-left flex justify-between items-center hover:bg-zinc-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <BookOpenIcon className="w-5 h-5 text-blue-400" />
                        <span className="text-lg font-bold">Game Guide</span>
                    </div>
                    <ChevronRightIcon className="w-5 h-5 text-zinc-500" />
                </button>

                <div className="pt-6 border-t border-zinc-700 space-y-3">
                    <button 
                        onClick={() => setShowExportOptions(true)}
                        className="w-full bg-zinc-800 p-4 rounded-lg text-left flex justify-between items-center hover:bg-zinc-700 transition-colors"
                    >
                        <span className="text-lg font-bold">Export Save Data</span>
                        <ChevronRightIcon className="w-5 h-5 text-zinc-500" />
                    </button>

                    <button 
                        onClick={() => setShowEndCareerConfirm(true)}
                        className="w-full bg-zinc-800 p-4 rounded-lg text-left flex justify-between items-center hover:bg-red-900/20 transition-colors group"
                    >
                        <span className="text-lg font-bold text-red-500 group-hover:text-red-400">Delete Save / End Career</span>
                        <ChevronRightIcon className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>
            </div>

            {showEndCareerConfirm && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-800 p-6 rounded-xl border border-red-500/30 max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold text-red-500">Are you absolutely sure?</h3>
                        <p className="text-zinc-400 mt-2">This will permanently delete your save data. You cannot undo this action.</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowEndCareerConfirm(false)} className="flex-1 bg-zinc-700 py-2 rounded-lg font-bold">Cancel</button>
                            <button onClick={handleEndCareer} className="flex-1 bg-red-600 py-2 rounded-lg font-bold">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {showExportOptions && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-800 p-6 rounded-xl border border-zinc-700 max-w-sm w-full text-center">
                        <h3 className="text-xl font-bold">Export Game Save</h3>
                        <p className="text-zinc-400 mt-2">Download your current progress as a .json file to back it up or move to another device.</p>
                        <div className="mt-6 flex gap-3">
                            <button onClick={() => setShowExportOptions(false)} className="flex-1 bg-zinc-700 py-2 rounded-lg font-bold">Cancel</button>
                            <button onClick={handleExport} className="flex-1 bg-blue-600 py-2 rounded-lg font-bold">Download JSON</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MiscTab;