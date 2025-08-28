class SpeechService {
    private synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[];
    private utterance: SpeechSynthesisUtterance | null = null;
    private isUnlocked = false;

    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.loadVoices();
        // Some browsers load voices asynchronously.
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = this.loadVoices;
        }
    }

    private loadVoices = () => {
        this.voices = this.synth.getVoices();
    }
    
    public unlockAudio() {
        if (this.isUnlocked || !this.synth) return;

        // Create a silent utterance and speak it.
        // This is a common workaround to "unlock" the audio context in browsers
        // that block audio until a user gesture.
        const utterance = new SpeechSynthesisUtterance("");
        utterance.volume = 0;
        this.synth.speak(utterance);
        this.isUnlocked = true;
    }

    public speak(text: string, onEndCallback?: () => void) {
        if (this.synth.speaking) {
            this.synth.cancel();
        }

        if (text !== '') {
            this.utterance = new SpeechSynthesisUtterance(text);

            this.utterance.onend = () => {
                if (onEndCallback) {
                    onEndCallback();
                }
            };
            
            this.utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
                console.error(
                    `SpeechSynthesisUtterance error: ${event.error}.`,
                    `Utterance text: "${event.utterance.text.substring(0, 100)}..."`
                );
                // Also call onEnd on error to reset UI state
                if (onEndCallback) {
                    onEndCallback();
                }
            };

            // Prefer a high-quality, Indian male voice if available.
            const findIndianMaleVoice = () => {
                const allVoices = this.synth.getVoices();
                if (allVoices.length === 0) return null;
                
                // Ideal: Google voice for quality, Indian, Male
                let voice = allVoices.find(v => v.lang === 'en-IN' && v.name.toLowerCase().includes('google') && (v as any).gender === 'male');
                if (voice) return voice;

                // Fallback: Any Indian Male voice
                voice = allVoices.find(v => v.lang === 'en-IN' && (v as any).gender === 'male');
                if (voice) return voice;
                
                // Fallback: Any Indian voice
                voice = allVoices.find(v => v.lang === 'en-IN');
                if (voice) return voice;
                
                return null; // Return null if no Indian voice found
            };

            const preferredVoice = findIndianMaleVoice() || this.voices.find(v => v.name === 'Google US English') || this.voices.find(v => v.lang.startsWith('en-US')) || this.voices.find(v => v.lang.startsWith('en-GB')) || this.voices[0];
            
            if (preferredVoice) {
                this.utterance.voice = preferredVoice;
            }
            this.utterance.rate = 1;
            this.utterance.pitch = 1.1;

            this.synth.speak(this.utterance);
        }
    }

    public cancel() {
        if (this.synth) {
            this.synth.cancel();
        }
    }

    public isPlaying(): boolean {
        return this.synth.speaking;
    }
}

export const speechService = new SpeechService();