import React, { createContext, useReducer, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { db } from '../db/db';
import type { GameState, GameAction, Email, NpcSong, ChartEntry, ChartHistory, ArtistData, Artist, Group, Song, LabelSubmission, Contract, Release, XUser, XPost, XTrend, XChat, CustomLabel, PopBaseOffer, NpcAlbum, AlbumChartEntry, RedMicProState, GrammyCategory, GrammyAward, GrammyContender, OscarCategory, OscarAward, OscarContender, OnlyFansProfile, OnlyFansPost, XSuspensionStatus, SoundtrackAlbum, SoundtrackTrack, Manager, SecurityTeam, Label, VoguePhotoshoot, FeatureOffer, VmaAward, VmaCategory } from '../types';
import { INITIAL_MONEY, STREAM_INCOME_MULTIPLIER, SUBSCRIBER_THRESHOLD_STORE, VIEW_INCOME_MULTIPLIER, NPC_ARTIST_NAMES, NPC_SONG_ADJECTIVES, NPC_SONG_NOUNS, NPC_COVER_ART, LABELS, PLAYLIST_PITCH_COST, PLAYLIST_PITCH_SUCCESS_RATE, PLAYLIST_BOOST_MULTIPLIER, PLAYLIST_BOOST_WEEKS, GENRES, MANAGERS, SECURITY_TEAMS, GIGS } from '../constants';
import { generateWeeklyXContent } from '../utils/xContentGenerator';
import { REAL_WORLD_DISCOGRAPHIES } from '../realWorldDiscographies';

export const formatNumber = (num: number): string => {
    const number = Math.floor(num);
    if (number >= 1e12) return (number / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    if (number >= 1e9) return (number / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    if (number >= 1e6) return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (number >= 1e3) return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return number.toLocaleString();
};

const generateNpcs = (count: number, existingNpcs: NpcSong[] = []): NpcSong[] => {
    const npcs: NpcSong[] = [];
    const usedNames = new Set<string>(existingNpcs.map(npc => `${npc.title}-${npc.artist}`));
    for (let i = 0; i < count; i++) {
        let title = "";
        let artist = "";
        let combo = "";
        let attempts = 0;
        do {
            artist = NPC_ARTIST_NAMES[Math.floor(Math.random() * NPC_ARTIST_NAMES.length)];
            const realDisco = REAL_WORLD_DISCOGRAPHIES[artist];
            if (realDisco && realDisco.songs.length > 0 && Math.random() < 0.8) {
                const availableSongs = realDisco.songs.filter(s => !usedNames.has(`${s}-${artist}`));
                if (availableSongs.length > 0) title = availableSongs[Math.floor(Math.random() * availableSongs.length)];
            }
            if (!title) {
                const adj = NPC_SONG_ADJECTIVES[Math.floor(Math.random() * NPC_SONG_ADJECTIVES.length)];
                const noun = NPC_SONG_NOUNS[Math.floor(Math.random() * NPC_SONG_NOUNS.length)];
                title = `${adj} ${noun}`;
            }
            combo = `${title}-${artist}`;
            attempts++;
        } while (usedNames.has(combo) && attempts < 10);
        if (usedNames.has(combo)) title = `${title} (Remix)`;
        usedNames.add(combo);
        const basePopularity = Math.floor(75_000_000 * Math.exp(-0.04 * (i + existingNpcs.length)));
        npcs.push({ uniqueId: `npc_${combo.replace(/[^a-zA-Z0-9]/g, '')}`, title, artist, genre: GENRES[Math.floor(Math.random() * GENRES.length)], basePopularity });
    }
    return npcs;
};

const initialArtistData: ArtistData = {
    money: INITIAL_MONEY,
    hype: 0,
    popularity: 10,
    songs: [],
    releases: [],
    monthlyListeners: 0,
    lastFourWeeksStreams: [],
    lastFourWeeksViews: [],
    youtubeSubscribers: 0,
    videos: [],
    youtubeStoreUnlocked: false,
    merch: [],
    merchStoreBanner: null,
    inbox: [],
    streamsThisMonth: 0,
    viewsThisQuarter: 0,
    subsThisQuarter: 0,
    promotions: [],
    performedGigThisWeek: false,
    contract: null,
    contractHistory: [],
    labelSubmissions: [],
    customLabels: [],
    artistImages: [],
    artistVideoThumbnails: [],
    paparazziPhotos: [],
    tourPhotos: [],
    tours: [],
    manager: null,
    securityTeamId: null,
    xUsers: [],
    xPosts: [],
    xChats: [],
    xTrends: [],
    xFollowingIds: [],
    xSuspensionStatus: null,
    followers: 0,
    saves: 0,
    artistPick: null,
    listeningNow: 0,
    streamsHistory: [],
    firstChartEntry: null,
    redMicPro: { unlocked: false, subscriptionType: null },
    salesBoost: 0,
    isGoldTheme: false,
    grammyHistory: [],
    hasSubmittedForBestNewArtist: false,
    vmaHistory: [],
    hasSubmittedForVmaBestNewArtist: false,
    oscarHistory: [],
    onlyfans: null,
    fanWarStatus: null,
    soundtrackOfferCount: 0,
    offeredSoundtracks: [],
    weeksUntilNextSoundtrackOffer: Math.floor(Math.random() * 13) + 12,
};

const initialState: GameState = {
    careerMode: null,
    soloArtist: null,
    group: null,
    activeArtistId: null,
    artistsData: {},
    date: { week: 1, year: 2024 },
    currentView: 'game',
    activeTab: 'Home',
    activeYoutubeChannel: 'artist',
    npcs: [],
    npcAlbums: [],
    soundtrackAlbums: [],
    billboardHot100: [],
    billboardTopAlbums: [],
    albumChartHistory: {},
    chartHistory: {},
    spotifyGlobal50: [],
    hotPopSongs: [],
    hotRapRnb: [],
    electronicChart: [],
    countryChart: [],
    hotPopSongsHistory: {},
    hotRapRnbHistory: {},
    electronicChartHistory: {},
    countryChartHistory: {},
    spotifyNewEntries: 0,
    selectedVideoId: null,
    selectedReleaseId: null,
    selectedSoundtrackId: null,
    activeSubmissionId: null,
    activeGeniusOffer: null,
    activeOnTheRadarOffer: null,
    activeTrshdOffer: null,
    activeFallonOffer: null,
    activeSoundtrackOffer: null,
    activeFeatureOffer: null,
    selectedXUserId: null,
    selectedXChatId: null,
    contractRenewalOffer: null,
    activeTourId: null,
    viewingPastLabelId: null,
    activeVogueOffer: null,
    grammySubmissions: [],
    grammyCurrentYearNominations: null,
    activeGrammyPerformanceOffer: null,
    activeGrammyRedCarpetOffer: null,
    oscarSubmissions: [],
    oscarCurrentYearNominations: null,
    activeOscarPerformanceOffer: null,
};

const GameContext = createContext<{
    gameState: GameState;
    dispatch: React.Dispatch<GameAction>;
    activeArtist: Artist | Group | null;
    activeArtistData: ArtistData | null;
    allPlayerArtists: Array<Artist | Group>;
} | undefined>(undefined);

const gameReducer = (state: GameState, action: GameAction): GameState => {
    const allPlayerArtistsAndGroups: (Artist | Group)[] = state.careerMode === 'solo' && state.soloArtist ? [state.soloArtist] : (state.group ? [state.group, ...state.group.members] : []);
    const tmzUser: XUser = {
        id: 'tmz', name: 'TMZ', username: 'TMZ',
        avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSI4IiBmaWxsPSIjRkZGRkZGIi8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNCIgZmlsbD0iI0QzMjYyNiIvPjxwYXRoIGQ9Ik0xNiAyMHYyNGg2VjMybDQtNGg0djIwbC0xMi0xMi0xMiAxMnoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMzYgMjB2MjRoNlYzMmw0LTRoNHYyMGwtMTItMTItMTIgMTJ6IiBmaWxsPSIjRkZGIi8+PC9zdmc+',
        isVerified: true, bio: 'breaking news & celebrity gossip', followersCount: 19500000, followingCount: 150,
    };

    switch (action.type) {
        case 'START_SOLO_GAME': {
            const { artist, startYear } = action.payload;
            const startDate = { week: 1, year: startYear };
            const welcomeEmail: Email = {
                id: crypto.randomUUID(), sender: 'Red Mic', subject: `Welcome to the Music Industry, ${artist.name}!`,
                body: `Hey ${artist.name},\n\nThis is it, your first step into the world of music. We've given you $100,000 to start. Your fandom, The ${artist.fandomName}, are waiting. Spend your money wisely. Record hits, build your fanbase, and take over the charts. Good luck.\n\nThe Red Mic Team`,
                date: startDate, isRead: false, senderIcon: 'default'
            };
            const playerXUser: XUser = { id: artist.id, name: artist.name, username: artist.name.replace(/\s/g, '').toLowerCase(), avatar: artist.image, isVerified: true, isPlayer: true, bio: `Official account. Leader of the ${artist.fandomName}.`, followersCount: 1000, followingCount: 0 };
            return {
                ...initialState, careerMode: 'solo', soloArtist: artist, activeArtistId: artist.id, artistsData: { [artist.id]: { ...initialArtistData, inbox: [welcomeEmail], xUsers: [playerXUser, tmzUser] } }, date: startDate, npcs: generateNpcs(600)
            };
        }
        case 'CHANGE_VIEW': return { ...state, currentView: action.payload };
        case 'CHANGE_TAB': return { ...state, activeTab: action.payload };
        case 'CHANGE_ACTIVE_ARTIST': return { ...state, activeArtistId: action.payload };
        case 'PROGRESS_WEEK': {
            const newWeek = state.date.week + 1;
            const newYear = state.date.year + (newWeek > 52 ? 1 : 0);
            return { ...state, date: { week: newWeek > 52 ? 1 : newWeek, year: newYear } };
        }
        case 'RECORD_SONG': {
            if (!state.activeArtistId) return state;
            const data = state.artistsData[state.activeArtistId];
            return { ...state, artistsData: { ...state.artistsData, [state.activeArtistId]: { ...data, money: data.money - action.payload.cost, songs: [...data.songs, action.payload.song] } } };
        }
        case 'RELEASE_PROJECT': {
            if (!state.activeArtistId) return state;
            const data = state.artistsData[state.activeArtistId];
            const { release } = action.payload;
            return { ...state, artistsData: { ...state.artistsData, [state.activeArtistId]: { ...data, releases: [...data.releases, release], songs: data.songs.map(s => release.songIds.includes(s.id) ? { ...s, isReleased: true, releaseId: release.id } : s), hype: Math.min(100, data.hype + 20) } } };
        }
        case 'CREATE_FALLON_VIDEO': {
            if (!state.activeArtistId || !state.activeFallonOffer) return state;
            const { video, songId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === state.activeArtistId);
            if (!artistProfile) return state;
            const updatedData: ArtistData = { ...activeData, videos: [...activeData.videos, video], hype: Math.min(100, activeData.hype + 25) };
            let postContent = '';
            if (video.type === 'Live Performance' && songId) {
                const song = activeData.songs.find(s => s.id === songId);
                if (song) postContent = `${artistProfile.name} delivers an incredible performance of '${song.title}' on Jimmy Fallon.`;
            } else if (video.type === 'Interview') {
                const release = activeData.releases.find(r => r.id === state.activeFallonOffer!.releaseId);
                const interviewTropes = [`reveals on Jimmy Fallon that they want to do more acting...`, `teases a new sound for their next project...` ];
                postContent = `${artistProfile.name} ${interviewTropes[Math.floor(Math.random() * interviewTropes.length)]}`;
            }
            if (postContent) updatedData.xPosts.unshift({ id: crypto.randomUUID(), authorId: 'popbase', content: postContent, likes: 1000, retweets: 200, views: 5000, date: state.date });
            let newState = { ...state, artistsData: { ...state.artistsData, [state.activeArtistId]: updatedData } };
            if (state.activeFallonOffer.offerType === 'both' && state.activeFallonOffer.step === 'performance') newState.activeFallonOffer = { ...state.activeFallonOffer, step: 'interview' as const };
            else newState.activeFallonOffer = null;
            return newState;
        }
        case 'LOAD_GAME': return action.payload;
        case 'RESET_GAME': return initialState;
        default: return state;
    }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [gameState, dispatch] = useReducer(gameReducer, initialState);
    const allPlayerArtists = useMemo(() => {
        if (gameState.careerMode === 'solo' && gameState.soloArtist) return [gameState.soloArtist];
        if (gameState.group) return [gameState.group, ...gameState.group.members];
        return [];
    }, [gameState.careerMode, gameState.soloArtist, gameState.group]);
    const activeArtist = useMemo(() => allPlayerArtists.find(a => a.id === gameState.activeArtistId) || null, [allPlayerArtists, gameState.activeArtistId]);
    const activeArtistData = useMemo(() => gameState.activeArtistId ? gameState.artistsData[gameState.activeArtistId] : null, [gameState.activeArtistId, gameState.artistsData]);

    useEffect(() => {
        const load = async () => {
            const save = await db.saves.toArray();
            if (save.length > 0) dispatch({ type: 'LOAD_GAME', payload: save[0].state });
        };
        load();
    }, []);

    useEffect(() => {
        if (gameState.careerMode) db.saves.clear().then(() => db.saves.add({ state: gameState }));
    }, [gameState]);

    return (
        <GameContext.Provider value={{ gameState, dispatch, activeArtist, activeArtistData, allPlayerArtists }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};