class SpeechService {
    private synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[];
    private utterance: SpeechSynthesisUtterance | null = null;

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

            // Prefer a high-quality voice
            const preferredVoice = this.voices.find(v => v.name === 'Google US English') || this.voices.find(v => v.lang.startsWith('en-US')) || this.voices.find(v => v.lang.startsWith('en-GB')) || this.voices[0];
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