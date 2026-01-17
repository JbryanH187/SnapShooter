export { };

declare global {
    interface Window {
        electron: {
            onCaptureComplete: (callback: (data: any) => void) => void;
            getCaptures: () => Promise<any[]>;
            saveCapture: (capture: any) => Promise<any>;
            deleteCapture: (id: string) => Promise<void>;
        };
    }
}
