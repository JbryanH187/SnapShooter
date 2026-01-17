/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class', // Enable dark mode with class strategy
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#f0f4ff',
                    100: '#e0e7ff',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    900: '#312e81',
                },
                gray: {
                    25: '#fcfcfd',
                    50: '#f9fafb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    600: '#4b5563',
                    700: '#374151',
                    800: '#1f2937',
                    900: '#111827',
                },
                success: {
                    50: '#f0fdf4',
                    500: '#22c55e',
                    600: '#16a34a',
                },
                error: {
                    50: '#fef2f2',
                    500: '#ef4444',
                    600: '#dc2626',
                },
                warning: {
                    50: '#fffbeb',
                    500: '#f59e0b',
                    600: '#d97706',
                }
            },
            fontFamily: {
                primary: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
                mono: ['JetBrains Mono', 'SF Mono', 'Cascadia Code', 'monospace'],
            },
            spacing: {
                '1': '4px',
                '2': '8px',
                '3': '12px',
                '4': '16px',
                '5': '20px',
                '6': '24px',
                '8': '32px',
                '10': '40px',
                '12': '48px',
                '16': '64px',
            }
        },
    },
    plugins: [],
}
