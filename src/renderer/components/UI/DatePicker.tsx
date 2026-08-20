import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DatePickerProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    label?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    
    // Safety check for invalid dates
    const getSafeDate = (dateStr: string) => {
        try {
            return dateStr ? parseISO(dateStr) : new Date();
        } catch {
            return new Date();
        }
    };

    const selectedDate = getSafeDate(value);
    const [currentMonth, setCurrentMonth] = useState(selectedDate);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    const toggleOpen = () => {
        if (!isOpen && containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            // We want to center it below or just align left
            // Let's align left, right below the input
            let topPos = rect.bottom + 8;
            // Basic screen bounds check (if it goes below window)
            if (topPos + 300 > window.innerHeight) {
                topPos = rect.top - 308; // 300 is approx height of calendar
            }
            setCoords({ top: topPos, left: rect.left });
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedInsideInput = containerRef.current?.contains(target);
            const clickedInsidePopover = popoverRef.current?.contains(target);
            
            if (!clickedInsideInput && !clickedInsidePopover) {
                setIsOpen(false);
            }
        };

        const handleScrollOrResize = () => setIsOpen(false);

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', handleScrollOrResize);
            window.addEventListener('scroll', handleScrollOrResize, true); // true = capture phase to catch any scroll
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [isOpen]);

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-4">
                <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentMonth(subMonths(currentMonth, 1)); }}
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-semibold capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </span>
                <button 
                    onClick={(e) => { e.stopPropagation(); setCurrentMonth(addMonths(currentMonth, 1)); }}
                    className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        );
    };

    const renderDays = () => {
        const dateFormat = 'EEEEEE';
        const days = [];
        let startDate = startOfWeek(currentMonth, { weekStartsOn: 1 });

        for (let i = 0; i < 7; i++) {
            days.push(
                <div key={i} className="text-center text-[10px] font-semibold opacity-50 mb-2">
                    {format(addDays(startDate, i), dateFormat, { locale: es }).toUpperCase()}
                </div>
            );
        }
        return <div className="grid grid-cols-7">{days}</div>;
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = '';

        while (day <= endDate) {
            for (let i = 0; i < 7; i++) {
                formattedDate = format(day, 'd');
                const cloneDay = day;
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, monthStart);
                const isToday = isSameDay(day, new Date());

                days.push(
                    <button
                        key={day.toString()}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(format(cloneDay, 'yyyy-MM-dd'));
                            setIsOpen(false);
                        }}
                        className={`p-1 w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-colors
                            ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                            ${isSelected ? 'bg-primary-500 text-white shadow-md' : 'hover:bg-black/5 dark:hover:bg-white/10'}
                            ${isToday && !isSelected ? 'border border-primary-500 text-primary-500' : ''}
                        `}
                    >
                        <span>{formattedDate}</span>
                    </button>
                );
                day = addDays(day, 1);
            }
            rows.push(
                <div className="grid grid-cols-7 gap-1" key={day.toString()}>
                    {days}
                </div>
            );
            days = [];
        }
        return <div className="flex flex-col gap-1">{rows}</div>;
    };

    return (
        <div className="w-full">
            {label && <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--label-secondary)' }}>{label}</label>}
            
            <div 
                ref={containerRef}
                className="w-full border rounded py-1.5 lg:py-2 px-3 text-xs lg:text-sm cursor-pointer flex items-center gap-2 outline-none focus:ring-2 focus:ring-primary-500 transition-shadow"
                style={{ background: 'var(--fill-secondary)', borderColor: 'var(--separator-opaque)', color: 'var(--label-primary)' }}
                onClick={toggleOpen}
            >
                <CalendarIcon size={14} style={{ color: 'var(--label-secondary)' }} />
                <span className="truncate">{format(selectedDate, 'dd MMM yyyy', { locale: es })}</span>
            </div>

            {isOpen && createPortal(
                <AnimatePresence>
                    <motion.div 
                        ref={popoverRef}
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="fixed z-[9999] p-4 rounded-xl shadow-2xl border"
                        style={{ 
                            top: coords.top,
                            left: coords.left,
                            background: 'var(--system-background)', 
                            borderColor: 'var(--separator-opaque)',
                            width: '260px',
                            color: 'var(--label-primary)',
                        }}
                    >
                        {renderHeader()}
                        {renderDays()}
                        {renderCells()}
                    </motion.div>
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
