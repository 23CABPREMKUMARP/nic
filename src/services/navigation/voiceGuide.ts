
export type Language = 'en' | 'ta';

export class VoiceGuide {
    private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
    private static currentLang: Language = 'en';

    static setLanguage(lang: Language) {
        this.currentLang = lang;
        console.log(`🔊 VoiceGuide: Language set to ${lang}`);
    }

    static speak(text: string, tamilText?: string) {
        if (!this.synth) return;
        this.synth.cancel();

        const message = this.currentLang === 'ta' && tamilText ? tamilText : text;
        const utterance = new SpeechSynthesisUtterance(message);

        // Advanced Voice Selection
        const voices = this.synth.getVoices();
        if (this.currentLang === 'ta') {
            // Priority: Regional Tamil -> Indian English Fallback
            const taVoice = voices.find(v => v.lang.includes('ta-IN') || v.lang === 'ta-IN');
            if (taVoice) {
                utterance.voice = taVoice;
            } else {
                const hiVoice = voices.find(v => v.lang.includes('hi-IN') || v.lang.includes('en-IN'));
                if (hiVoice) utterance.voice = hiVoice;
            }
        } else {
            const enVoice = voices.find(v => v.lang === 'en-IN' || v.lang === 'en-GB');
            if (enVoice) utterance.voice = enVoice;
        }

        utterance.rate = 0.85; // Slower for clarity in mountainous echo/car noise
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        this.synth.speak(utterance);
    }

    static announceHillAlert(type: string) {
        const alerts: Record<string, { en: string, ta: string }> = {
            'HAIRPIN': {
                en: "Attention: Sharp hairpin bend ahead. Use your horn and stay left.",
                ta: "கவனம்: முன்னே கொண்டை ஊசி வளைவு உள்ளது. ஒலி எழுப்பி இடதுபுறமாகச் செல்லவும்."
            },
            'STEEP_DECLINE': {
                en: "Steep decline detected. Shift to second gear to protect your brakes.",
                ta: "அதிகமான இறக்கம். பிரேக்குகளைப் பாதுகாக்க இரண்டாவது கியருக்கு மாறவும்."
            },
            'BRAKE_WARNING': {
                en: "Brake temperature rising. Please use engine braking immediately.",
                ta: "பிரேக் சூடு அதிகமாகிறது. உடனயாக என்ஜின் பிரேக்கிங்கைப் பயன்படுத்தவும்."
            },
            'MIST_ZONE': {
                en: "Heavy fog ahead. Visibility 10 meters. Fog lights recommended.",
                ta: "கடும் மூடுபனி. பனி விளக்குகளைப் பயன்படுத்தவும்."
            },
            'ACCIDENT_PRONE': {
                en: "High accident zone. Please drive with extreme caution.",
                ta: "விபத்து அதிகம் நிகழும் பகுதி. மிகுந்த எச்சரிக்கையுடன் ஓட்டவும்."
            }
        };

        const alert = alerts[type];
        if (alert) {
            this.speak(alert.en, alert.ta);
        }
    }

    static announceArrival(placeName: string) {
        this.speak(
            `You have arrived at ${placeName}. Please find authorized parking nearby.`,
            `நீங்கள் ${placeName} இடத்திற்கு வந்துவிட்டீர்கள். அருகிலுள்ள அங்கீகரிக்கப்பட்ட வாகன நிறுத்துமிடத்தைப் பயன்படுத்தவும்.`
        );
    }
}
