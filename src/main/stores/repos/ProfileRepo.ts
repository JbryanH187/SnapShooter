import Store from 'electron-store';

export class ProfileRepo {
    constructor(private store: Store<any>) {}

    saveUserProfile(name: string): void {
        this.store.set('userProfile', { name, initialized: true });
    }

    getUserProfile(): { name: string; initialized: boolean } {
        return this.store.get('userProfile', { name: '', initialized: false }) as { name: string; initialized: boolean };
    }
}
