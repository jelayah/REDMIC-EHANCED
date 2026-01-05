import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import type { Video, ArtistData } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import DotsVerticalIcon from './icons/DotsVerticalIcon';

const VideoItem: React.FC<{ video: Video }> = ({ video }) => {
    const { gameState, dispatch } = useGame();
    return (
        <button onClick={() => { dispatch({ type: 'SELECT_VIDEO', payload: video.id }); dispatch({ type: 'CHANGE_VIEW', payload: 'youtubeVideoDetail' }); }} className="w-full text-left">
            <div className="w-full aspect-video rounded-lg overflow-hidden bg-zinc-800">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex gap-3 mt-3 px-2">
                <div className="flex-grow min-w-0">
                    <h4 className="font-semibold leading-tight line-clamp-2">{video.title}</h4>
                    <p className="text-xs text-zinc-400">{formatNumber(video.views)} views</p>
                </div>
                <DotsVerticalIcon className="w-5 h-5 text-zinc-400 flex-shrink-0" />
            </div>
        </button>
    );
};

const YouTubeView: React.FC = () => {
    const { gameState, dispatch, activeArtistData } = useGame();
    if (!activeArtistData) return null;
    const { videos } = activeArtistData;

    return (
        <div className="bg-[#0f0f0f] text-white min-h-screen">
            <header className="p-3 flex items-center justify-between sticky top-0 bg-[#0f0f0f]/80 backdrop-blur-sm z-10">
                <div className="flex items-center gap-2">
                    <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} className="p-2"><ArrowLeftIcon className="w-6 h-6"/></button>
                    <YouTubeIcon className="w-8 h-8 text-red-500" />
                    <h1 className="text-2xl font-bold tracking-tighter">YouTube</h1>
                </div>
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'createVideo' })} className="bg-red-600 px-4 py-1.5 rounded-full text-sm font-bold">Create</button>
            </header>
            <div className="p-3 space-y-6">
                {videos.length > 0 ? (
                    videos.map(video => <VideoItem key={video.id} video={video} />)
                ) : (
                    <div className="text-center py-20 text-zinc-500">
                        <p>No videos yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YouTubeView;