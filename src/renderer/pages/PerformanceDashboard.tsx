import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { performanceTracker } from '../../shared/telemetry/PerformanceTracker';
import { Activity, AlertCircle, Download, Trash2, Clock } from 'lucide-react';

export const PerformanceDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<any>({});
    const [actionStats, setActionStats] = useState<Record<string, number>>({});
    const [errorStats, setErrorStats] = useState<Record<string, number>>({});
    const [recentActions, setRecentActions] = useState<any[]>([]);
    const [recentErrors, setRecentErrors] = useState<any[]>([]);

    const refreshMetrics = () => {
        setMetrics(performanceTracker.getAllMetrics());
        setActionStats(performanceTracker.getActionStats());
        setErrorStats(performanceTracker.getErrorStats());
        setRecentActions(performanceTracker.getRecentActions(5));
        setRecentErrors(performanceTracker.getRecentErrors(5));
    };

    useEffect(() => {
        refreshMetrics();
        // Refresh every 5 seconds
        const interval = setInterval(refreshMetrics, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleExport = () => {
        const data = performanceTracker.exportMetrics();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metrics-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleClear = () => {
        if (confirm('Clear all performance metrics?')) {
            performanceTracker.clear();
            refreshMetrics();
        }
    };

    const totalActions = Object.values(actionStats).reduce((sum, count) => sum + count, 0);
    const totalErrors = Object.values(errorStats).reduce((sum, count) => sum + count, 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Activity className="text-primary-500" />
                        Performance Dashboard
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Application metrics and diagnostics
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
                    >
                        <Download size={16} />
                        Export JSON
                    </button>
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                        <Trash2 size={16} />
                        Clear
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Actions */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-700"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Actions</span>
                        <Activity size={20} className="text-blue-500" />
                    </div>
                    <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                        {totalActions}
                    </div>
                </motion.div>

                {/* Total Errors */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-700"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">Total Errors</span>
                        <AlertCircle size={20} className="text-red-500" />
                    </div>
                    <div className="text-3xl font-bold text-red-900 dark:text-red-100">
                        {totalErrors}
                    </div>
                </motion.div>

                {/* Metrics Tracked */}
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-700"
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-600 dark:text-green-400">Metrics Tracked</span>
                        <Clock size={20} className="text-green-500" />
                    </div>
                    <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                        {Object.keys(metrics).length}
                    </div>
                </motion.div>
            </div>

            {/* Recent Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Recent Actions
                </h3>
                {recentActions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No actions tracked yet</p>
                ) : (
                    <div className="space-y-2">
                        {recentActions.map((action, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {action.name}
                                </span>
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                    <span>{action.duration.toFixed(2)}ms</span>
                                    <span>{new Date(action.timestamp).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Performance Metrics Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Performance Metrics
                </h3>
                {Object.keys(metrics).length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No metrics available</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Operation</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Avg (ms)</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Min (ms)</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Max (ms)</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">P95 (ms)</th>
                                    <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(metrics).map(([name, stats]: [string, any]) => (
                                    <tr key={name} className="border-t border-gray-200 dark:border-gray-700">
                                        <td className="px-4 py-2 text-gray-900 dark:text-gray-100 font-mono text-xs">{name}</td>
                                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{stats.avg.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{stats.min.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{stats.max.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{stats.p95.toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">{stats.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
