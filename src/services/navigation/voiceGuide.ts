
export type Language = 'en' | 'ta';

export class VoiceGuide {
    private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
    private static currentLang: Language = 'en';

    static setLanguage(lang: Language) {
        this.currentLang = lang;
    }

    static speak(text: string, tamilText?: string) {
        if (!this.synth) return;
        this.synth.cancel();

        const message = this.currentLang === 'ta' && tamilText ? tamilText : text;
        const utterance = new SpeechSynthesisUtterance(message);

        // Try to find a Tamil voice if in Tamil mode
        if (this.currentLang === 'ta') {
            const voices = this.synth.getVoices();
            const taVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('IN'));
            if (taVoice) utterance.voice = taVoice;
        }

        utterance.rate = 0.9; // Slightly slower for clarity in noisy traffic
        this.synth.speak(utterance);
    }

    static announceHillAlert(type: string) {
        const alerts: Record<string, { en: string, ta: string }> = {
            'HAIRPIN': {
                en: "Sharp hairpin bend ahead. Slow down and sound your horn.",
                ta: "முன்னால் கொண்டை ஊசி வளைவு உள்ளது. மெதுவாகச் சென்று ஒலி எழுப்பவும்."
            },
            'STEEP_DECLINE': {
                en: "Steep decline. Use a lower gear to prevent brake heating.",
                ta: "செங்குத்தான இறக்கம். பிரேக் சூடாவதைத் தவிர்க்க லோயர் கியரைப் பயன்படுத்தவும்."
            },
            'BRAKE_WARNING': {
                en: "Brake heating warning. Stop safely and let brakes cool if needed.",
                ta: "பிரேக் சூடாக்கும் எச்சரிக்கை. தேவைப்பட்டால் பாதுகாப்பாக நிறுத்தி பிரேக்குகளை குளிர வைக்கவும்."
            },
            'MIST_ZONE': {
                en: "Foggy zone. Turn on your fog lights and reduce speed.",
                ta: "மூடுபனி பகுதி. பனி விளக்குகளை ஒளிரவிட்டு வேகத்தை குறைக்கவும்."
            }
        };

        const alert = alerts[type];
        if (alert) {
            this.speak(alert.en, alert.ta);
        }
    }
}
