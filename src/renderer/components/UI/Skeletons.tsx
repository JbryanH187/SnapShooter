import React from 'react';
import { motion } from 'framer-motion';

export const RecentsSkeleton: React.FC = () => {
    // Generate an array of 8 placeholder items
    const placeHolders = Array.from({ length: 12 });

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-1">
            {placeHolders.map((_, i) => (
                <div
                    key={i}
                    className="flex flex-col p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 h-[300px]"
                >
                    {/* Thumbnail Skeleton */}
                    <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 animate-pulse" />

                    {/* Meta Skeleton */}
                    <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse" />
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse" />
                    </div>

                    {/* Footer Skeleton */}
                    <div className="mt-4 flex justify-between items-center">
                        <div className="h-5 w-20 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse" />
                    </div>
                </div>
            ))}
        </div>
    );
};
