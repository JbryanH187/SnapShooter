import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Filter as FilterIcon, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DateFilter, StatusFilter } from '../../hooks/useCaptureSearch';
import { LiquidGlass } from './LiquidGlass';

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

    const statusOptions: { value: StatusFilter; label: string; icon: React.ReactNode; colorVar: string }[] = [
        { value: 'all', label: 'All Status', icon: <FilterIcon size={14} />, colorVar: 'var(--label-secondary)' },
        { value: 'success', label: 'Success', icon: <CheckCircle size={14} />, colorVar: 'var(--system-green)' },
        { value: 'failure', label: 'Failure', icon: <XCircle size={14} />, colorVar: 'var(--system-red)' },
        { value: 'pending', label: 'Pending', icon: <Clock size={14} />, colorVar: 'var(--system-orange)' },
    ];

    const activeDate = dateOptions.find(o => o.value === dateFilter);
    const activeStatus = statusOptions.find(o => o.value === statusFilter);

    return (
        <div
            className="flex items-center justify-between px-6 py-3 border-b"
            style={{
                background: 'var(--system-background-secondary)',
                borderColor: 'var(--separator-non-opaque)'
            }}
        >
            {/* Left: Filter Controls */}
            <div className="flex items-center gap-2">
                {/* Date Filter */}
                <div className="relative">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowDateMenu(!showDateMenu)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all"
                        style={{
                            background: dateFilter !== 'all' ? 'var(--system-blue)' : 'var(--fill-secondary)',
                            color: dateFilter !== 'all' ? 'white' : 'var(--label-primary)',
                            border: `1px solid ${dateFilter !== 'all' ? 'var(--system-blue)' : 'var(--separator-opaque)'}`,
                            borderRadius: 'var(--radius-base)'
                        }}
                    >
                        <span style={{ color: dateFilter !== 'all' ? 'white' : 'var(--label-secondary)' }}>
                            {activeDate?.icon}
                        </span>
                        <span>{activeDate?.label}</span>
                    </motion.button>

                    <AnimatePresence>
                        {showDateMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowDateMenu(false)} />
                                <LiquidGlass
                                    material="regular"
                                    className="absolute top-full left-0 mt-2 w-48 overflow-hidden z-20"
                                    style={{
                                        borderRadius: 'var(--radius-card)',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                                    }}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        {dateOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    onDateFilterChange(option.value);
                                                    setShowDateMenu(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors"
                                                style={{
                                                    background: dateFilter === option.value ? 'var(--fill-tertiary)' : 'transparent',
                                                    color: 'var(--label-primary)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (dateFilter !== option.value) {
                                                        e.currentTarget.style.background = 'var(--fill-secondary)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (dateFilter !== option.value) {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }
                                                }}
                                            >
                                                <span style={{ color: 'var(--label-secondary)' }}>{option.icon}</span>
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                </LiquidGlass>
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
                        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium transition-all"
                        style={{
                            background: statusFilter !== 'all' ? activeStatus?.colorVar : 'var(--fill-secondary)',
                            color: statusFilter !== 'all' ? 'white' : 'var(--label-primary)',
                            border: `1px solid ${statusFilter !== 'all' ? activeStatus?.colorVar : 'var(--separator-opaque)'}`,
                            borderRadius: 'var(--radius-base)'
                        }}
                    >
                        <span style={{ color: statusFilter !== 'all' ? 'white' : activeStatus?.colorVar }}>
                            {activeStatus?.icon}
                        </span>
                        <span>{activeStatus?.label}</span>
                    </motion.button>

                    <AnimatePresence>
                        {showStatusMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
                                <LiquidGlass
                                    material="regular"
                                    className="absolute top-full left-0 mt-2 w-48 overflow-hidden z-20"
                                    style={{
                                        borderRadius: 'var(--radius-card)',
                                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
                                    }}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        {statusOptions.map((option) => (
                                            <button
                                                key={option.value}
                                                onClick={() => {
                                                    onStatusFilterChange(option.value);
                                                    setShowStatusMenu(false);
                                                }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm transition-colors"
                                                style={{
                                                    background: statusFilter === option.value ? 'var(--fill-tertiary)' : 'transparent',
                                                    color: 'var(--label-primary)'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (statusFilter !== option.value) {
                                                        e.currentTarget.style.background = 'var(--fill-secondary)';
                                                    }
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (statusFilter !== option.value) {
                                                        e.currentTarget.style.background = 'transparent';
                                                    }
                                                }}
                                            >
                                                <span style={{ color: option.colorVar }}>{option.icon}</span>
                                                <span>{option.label}</span>
                                            </button>
                                        ))}
                                    </motion.div>
                                </LiquidGlass>
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
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
                        style={{ color: 'var(--label-secondary)' }}
                        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--label-primary)'}
                        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--label-secondary)'}
                    >
                        <X size={14} />
                        Clear filters
                    </motion.button>
                )}
            </div>

            {/* Right: Result Count */}
            <div className="text-sm" style={{ color: 'var(--label-secondary)' }}>
                {hasActiveFilters ? (
                    <span>
                        Showing <strong style={{ color: 'var(--label-primary)' }}>{resultCount}</strong> of {totalCount}
                    </span>
                ) : (
                    <span>
                        <strong style={{ color: 'var(--label-primary)' }}>{totalCount}</strong> {totalCount === 1 ? 'capture' : 'captures'}
                    </span>
                )}
            </div>
        </div>
    );
};
