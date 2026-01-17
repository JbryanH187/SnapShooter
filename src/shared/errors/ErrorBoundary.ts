export class CaptureErrorBoundary {
    // NIVEL 1: Capture fallbacks
    static async handleCaptureError(error: Error): Promise<string> {
        console.error('Primary capture failed:', error);

        // Fallback logic would go here
        throw new Error('Unable to capture screen: ' + error.message);
    }
}
