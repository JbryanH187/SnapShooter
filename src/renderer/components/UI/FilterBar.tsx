import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Filter as FilterIcon, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DateFilter, StatusFilter } from '../../hooks/useCaptureSearch';

interface FilterBarProps {
    dateFilter: DateFilter;
    statusFilter: StatusFilter;
    onDateFilterChange: (filter: DateFilter) => void;
    onStatusFilterChange: (filter: StatusFilter) => void;
    resultCount: number;
    totalCount: number;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
    dateFilter,
    statusFilter,
    onDateFilterChange,
    onStatusFilterChange,
    resultCount,
    totalCount,
    hasActiveFilters,
    onClearFilters
}) => {
    const [showDateMenu, setShowDateMenu] = useState(false);
    const [showStatusMenu, setShowStatusMenu] = useState(false);

    const dateOptions: { value: DateFilter; label: string; icon: React.ReactNode }[] = [
        { value: 'all', label: 'All Time', icon: <Calendar size={14} /> },
        { value: 'today', label: 'Today', icon: <Clock size={14} /> },
        { value: 'week', label: 'Past Week', icon: <Calendar size={14} /> },
        { value: 'month', label: 'Past Month', icon: <Calendar size={14} /> },
    ];

    const statusOptions: { value: StatusFilter; label: string; icon: React.ReactNode; color: string }[] = [
        { value: 'all', label: 'All Status', icon: <FilterIcon size={14} />, color: 'text-gray-600' },
        { value: 'success', label: 'Success', icon: <CheckCircle size={14} />, color: 'text-green-600' },
        { value: 'failure', label: 'Failure', icon: <XCircle size={14} />, color: 'text-red-600' },
        { value: 'pending', label: 'Pending', icon: <Clock size={14} />, color: 'text-gray-600' },
    ];

    const activeDate = dateOptions.find(o => o.value === dateFilter);
    const activeStatus = statusOptions.find(o => o.value === statusFilter);

    return (
        <div className="flex items-center justify-between px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700/50">
            {/* Left: Filter Controls */}
            <div className="flex items-center gap-2">
                {/* Date Filter */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDateMenu(!showDateMenu)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${dateFilter !== 'all'
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        {activeDate?.icon}
                        <span>{activeDate?.label}</span>
                    </motion.button>

                    <AnimatePresence>
                        {showDateMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowDateMenu(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
                                >
                                    {dateOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                onDateFilterChange(option.value);
                                                setShowDateMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${dateFilter === option.value
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {option.icon}
                                            <span>{option.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Status Filter */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter !== 'all'
                                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <span className={activeStatus?.color}>{activeStatus?.icon}</span>
                        <span>{activeStatus?.label}</span>
                    </motion.button>

                    <AnimatePresence>
                        {showStatusMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-20"
                                >
                                    {statusOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => {
                                                onStatusFilterChange(option.value);
                                                setShowStatusMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors ${statusFilter === option.value
                                                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            <span className={option.color}>{option.icon}</span>
                                            <span>{option.label}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <motion.button
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onClearFilters}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        <X size={14} />
                        Clear filters
                    </motion.button>
                )}
            </div>

            {/* Right: Result Count */}
            <div className="text-sm text-gray-500 dark:text-gray-400">
                {hasActiveFilters ? (
                    <span>
                        Showing <strong className="text-gray-900 dark:text-gray-100">{resultCount}</strong> of {totalCount}
                    </span>
                ) : (
                    <span>
                        <strong className="text-gray-900 dark:text-gray-100">{totalCount}</strong> {totalCount === 1 ? 'capture' : 'captures'}
                    </span>
                )}
            </div>
        </div>
    );
};
