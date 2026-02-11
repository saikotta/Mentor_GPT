import React, { useState } from "react";
import { ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * YouTubeEmbed Component
 * 
 * Implements the official YouTube iframe embed standard for production use.
 * 
 * NOTE ON CONSOLE WARNINGS:
 * Third-party CORS warnings (e.g. doubleclick.net) appearing in the browser console
 * are non-breaking, benign internal logs from YouTube's own scripts. 
 * They do not affect playback or application security.
 */

interface YouTubeEmbedProps {
    url: string;
    title: string;
}

export function YouTubeEmbed({ url, title }: YouTubeEmbedProps) {
    const [hasError, setHasError] = useState(false);

    /**
     * Extracts the YouTube Video ID and returns the standard embed URL.
     */
    const getEmbedUrl = (originalUrl: string) => {
        try {
            let videoId = "";
            const urlObj = new URL(originalUrl);

            if (urlObj.hostname === "youtu.be") {
                videoId = urlObj.pathname.slice(1);
            } else if (urlObj.pathname.includes("/shorts/")) {
                videoId = urlObj.pathname.split("/shorts/")[1].split("/")[0];
            } else if (urlObj.pathname.includes("/embed/")) {
                videoId = urlObj.pathname.split("/embed/")[1].split("/")[0];
            } else {
                videoId = urlObj.searchParams.get("v") || "";
            }

            // Standardize videoId by removing any trailing query params if parsing logic was literal
            videoId = videoId.split("?")[0].split("&")[0];

            if (!videoId) return null;

            // Official YouTube Embed Endpoint
            return `https://www.youtube.com/embed/${videoId}`;
        } catch (e) {
            return null;
        }
    };

    const embedUrl = getEmbedUrl(url);

    return (
        <div className="w-full space-y-4">
            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 shadow-2xl">
                {embedUrl && !hasError ? (
                    <iframe
                        src={`${embedUrl}?rel=0&modestbranding=1`}
                        title={title}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        className="absolute inset-0 w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        loading="lazy"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-900">
                        <AlertCircle className="w-12 h-12 text-amber-500" />
                        <div className="space-y-2">
                            <h4 className="text-white font-medium">Embedding Restricted</h4>
                            <p className="text-slate-400 text-sm max-w-sm">
                                This video can’t be embedded due to YouTube restrictions.
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => window.open(url, "_blank")}
                            className="bg-transparent border-slate-700 text-white hover:bg-slate-800"
                        >
                            Watch on YouTube <ExternalLink className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>

            <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 hover:text-blue-900 text-[10px] font-bold uppercase tracking-widest transition-colors"
                    onClick={() => window.open(url, "_blank")}
                >
                    Playback issues? Watch on YouTube
                    <ExternalLink className="ml-2 w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
