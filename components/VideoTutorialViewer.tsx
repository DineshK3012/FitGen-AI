import React, { useState, useCallback } from 'react';
import { searchYouTubeVideos } from '../services/geminiService';
import { Loader2, Play, ChevronLeft, ChevronRight, Youtube, AlertCircle } from 'lucide-react';
import { useRateLimit } from '../hooks/useRateLimit';
import { toast } from 'sonner';
import { VideoResult } from '../types';

interface Props {
    initialPrompt: string;
}

export const VideoTutorialViewer: React.FC<Props> = ({ initialPrompt }) => {
    const [videos, setVideos] = useState<VideoResult[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const { checkLimit } = useRateLimit('video_search', { limit: 5, interval: 60000 });

    const handleSearch = useCallback(async () => {
        if (!checkLimit()) return;

        setIsSearching(true);
        setHasSearched(true);
        const toastId = toast.loading('Searching for tutorials with Gemini...');

        try {
            const results = await searchYouTubeVideos(initialPrompt);
            if (results && results.length > 0) {
                console.log(results);
                setVideos(results);
                setActiveIndex(0);
                toast.success('Found relevant tutorials!', { id: toastId });
            } else {
                toast.error('No videos found.', { id: toastId });
            }
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Search failed', { id: toastId });
        } finally {
            setIsSearching(false);
        }
    }, [initialPrompt, checkLimit]);

    const nextVideo = () => {
        setActiveIndex((prev) => (prev + 1) % videos.length);
    };

    const prevVideo = () => {
        setActiveIndex((prev) => (prev - 1 + videos.length) % videos.length);
    };

    if (!hasSearched) {
        return (
            <button
                onClick={handleSearch}
                className="w-full py-3 border border-dashed border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 rounded-xl text-red-600 dark:text-red-400 font-medium text-sm hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 group"
            >
                <Youtube className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Find Video Tutorials
            </button>
        );
    }

    return (
        <div className="w-full space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video">
                {isSearching ? (
                    <div className="absolute inset-0 z-10 bg-slate-100 dark:bg-slate-900 flex items-center justify-center flex-col">
                        <Loader2 className="w-8 h-8 text-red-600 animate-spin mb-2" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Searching YouTube...
                        </span>
                    </div>
                ) : videos.length > 0 ? (
                    <>
                        <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${videos[activeIndex].videoId}`}
                            title={videos[activeIndex].title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>

                        {videos.length > 1 && (
                            <>
                                <button
                                    onClick={prevVideo}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={nextVideo}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </>
                        )}

                        {/* External Link Fallback */}
                        <a
                            href={`https://www.youtube.com/watch?v=${videos[activeIndex].videoId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-3 right-3 z-10 bg-black/60 hover:bg-red-600 backdrop-blur-md text-white px-2 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Youtube size={12} />
                            Open in App
                        </a>
                    </>
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                        <span className="text-sm">No tutorials found</span>
                        <button onClick={handleSearch} className="mt-2 text-xs text-indigo-500 hover:underline">Try Again</button>
                    </div>
                )}
            </div>

            {!isSearching && videos.length > 0 && (
                <div className="flex items-center justify-between px-1">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 line-clamp-1 flex-1 mr-2">
                        <span className="text-red-500 mr-1">▶</span>
                        {videos[activeIndex].title}
                    </p>
                    <div className="flex gap-1">
                        {videos.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === activeIndex ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};