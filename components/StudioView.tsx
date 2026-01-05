import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { GENRES, STUDIOS, NPC_ARTIST_NAMES } from '../constants';
import type { Song } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const StudioView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const { careerMode, group } = gameState;
    
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState(GENRES[0]);
    const [studioIndex, setStudioIndex] = useState(0);
    const [isExplicit, setIsExplicit] = useState(false);
    const [isDeluxeTrack, setIsDeluxeTrack] = useState(false);
    const [coverArt, setCoverArt] = useState<string | null>(null);
    const [collaboration, setCollaboration] = useState<{ artistName: string; cost: number } | null>(null);
    const [error, setError] = useState('');

    if (!activeArtistData || !activeArtist) return null;
    const { money, releases } = activeArtistData;
    const selectedStudio = STUDIOS[studioIndex];

    const hasReleasedAlbum = useMemo(() => releases.some(r => r.type === 'Album' || r.type === 'Album (Deluxe)'), [releases]);

    const potentialCollaborators = useMemo(() => {
        const npcs = NPC_ARTIST_NAMES;
        let groupMembers: string[] = [];
        if (careerMode === 'group' && group) {
            groupMembers = group.members.filter(m => m.id !== activeArtist.id).map(m => m.name);
        }
        return [...npcs, ...groupMembers].sort();
    }, [careerMode, group, activeArtist]);

    const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => setCoverArt(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleRecord = () => {
        if (!title.trim() || !coverArt) {
            setError('Song title and cover art are required.');
            return;
        }
        const totalCost = selectedStudio.cost + (collaboration ? collaboration.cost : 0);
        if (money < totalCost) {
            setError("Insufficient funds.");
            return;
        }
        const [min, max] = selectedStudio.qualityRange;
        const quality = Math.min(100, Math.floor(Math.random() * (max - min + 1)) + min + (collaboration ? 5 : 0));
        const newSong: Song = {
            id: crypto.randomUUID(), title: collaboration ? `${title.trim()} (feat. ${collaboration.artistName})` : title.trim(),
            genre, quality, coverArt, isReleased: false, streams: 0, lastWeekStreams: 0, prevWeekStreams: 0,
            duration: 180, explicit: isExplicit, artistId: activeArtist.id, isDeluxeTrack
        };
        dispatch({ type: 'RECORD_SONG', payload: { song: newSong, cost: totalCost } });
        dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
    };

    return (
        <div className="h-screen w-full bg-zinc-900 overflow-y-auto">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Studio</h1>
            </header>
            <div className="p-4 space-y-6">
                <div className="flex justify-center">
                    <label htmlFor="cover-art" className="cursor-pointer">
                        <div className="w-48 h-48 rounded-lg bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-red-500">
                            {coverArt ? <img src={coverArt} className="w-full h-full rounded-lg object-cover" /> : <span className="text-zinc-400 text-sm">Upload Cover</span>}
                        </div>
                    </label>
                    <input id="cover-art" type="file" accept="image/*" className="hidden" onChange={handleCoverArtUpload} />
                </div>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Song Title" className="w-full bg-zinc-700 p-3 rounded-md"/>
                <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-zinc-700 p-3 rounded-md">
                    {GENRES.map(g => <option key={g}>{g}</option>)}
                </select>
                <div className="grid grid-cols-2 gap-4">
                    {STUDIOS.map((s, i) => (
                        <button key={s.name} onClick={() => setStudioIndex(i)} className={`p-4 rounded-lg text-left border-2 ${studioIndex === i ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800'}`}>
                            <p className="font-bold">{s.name}</p>
                            <p className="text-sm text-green-400">-${s.cost.toLocaleString()}</p>
                        </button>
                    ))}
                </div>
                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                <button onClick={handleRecord} className="w-full h-12 bg-red-600 font-bold rounded-lg shadow-lg">Record Song</button>
            </div>
        </div>
    );
};

export default StudioView;