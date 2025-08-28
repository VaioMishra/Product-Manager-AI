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

            // Prefer a high-quality US Male voice.
            const findUSMaleVoice = () => {
                const allVoices = this.synth.getVoices();
                if (allVoices.length === 0) return null;
                
                // Common keywords for male voices in Web Speech API
                const maleVoiceKeywords = ['male', 'david', 'mark', 'google us english'];

                // Filter for US English voices first
                const usVoices = allVoices.filter(v => v.lang === 'en-US');
                if (usVoices.length === 0) return null;

                // 1. Prioritize Google's high-quality male voices.
                let voice = usVoices.find(v =>
                    v.name.toLowerCase().includes('google') &&
                    maleVoiceKeywords.some(keyword => v.name.toLowerCase().includes(keyword))
                );
                if (voice) return voice;
                
                // 2. Fallback to any US voice that sounds male based on name.
                voice = usVoices.find(v => maleVoiceKeywords.some(keyword => v.name.toLowerCase().includes(keyword)));
                if (voice) return voice;

                // 3. As a strong fallback, use the primary "Google US English" voice if available.
                voice = usVoices.find(v => v.name === 'Google US English');
                if (voice) return voice;

                // 4. If none of the above, just pick the first available US voice.
                return usVoices[0];
            };

            const preferredVoice = findUSMaleVoice() || this.voices.find(v => v.lang.startsWith('en-US')) || this.voices.find(v => v.lang.startsWith('en-GB')) || this.voices[0];
            
            if (preferredVoice) {
                this.utterance.voice = preferredVoice;
            }
            // Adjusted for a natural, mid-range male voice.
            this.utterance.rate = 1.0;
            this.utterance.pitch = 0.9;

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