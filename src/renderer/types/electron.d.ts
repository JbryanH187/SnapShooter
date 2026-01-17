export { };

declare global {
    interface Window {
        electron: {
            onCaptureComplete: (callback: (data: any) => void) => () => void;
            saveUserProfile: (name: string) => Promise<void>;
            readImage: (path: string) => Promise<string>;
            getCaptures: () => Promise<any[]>;
            getUserProfile: () => Promise<any>;
            deleteCapture: (id: string) => Promise<void>;
            clearCaptures: () => Promise<void>;
            saveCapture: (capture: any) => Promise<any>;
            openCapturesFolder: () => Promise<void>; // Added this line
            // History  
            getReportHistory: () => Promise<any[]>;
            saveReportToHistory: (report: any) => Promise<void>;
            deleteReportFromHistory: (id: string) => Promise<void>;
            openPath: (path: string) => Promise<void>;
            setOverlayStyle: (style: { color: string; symbolColor: string }) => Promise<void>;
        };
    }
}