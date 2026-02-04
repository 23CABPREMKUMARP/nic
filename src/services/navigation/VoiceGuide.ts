/**
 * Voice Guide - Tamil and English TTS navigation
 * Optimized for hill terrain with clear, calm announcements
 */

export type Language = 'en' | 'ta';

export interface VoiceSettings {
    language: Language;
    rate: number;
    pitch: number;
    volume: number;
    enabled: boolean;
}

const DEFAULT_SETTINGS: VoiceSettings = {
    language: 'en',
    rate: 0.85, // Slower for clarity in car/mountain noise
    pitch: 1.0,
    volume: 1.0,
    enabled: true
};

export class VoiceGuide {
    private static synth: SpeechSynthesis | null = typeof window !== 'undefined' ? window.speechSynthesis : null;
    private static settings: VoiceSettings = { ...DEFAULT_SETTINGS };
    private static voicesLoaded: boolean = false;

    /**
     * Initialize voice guide and load voices
     */
    static init() {
        if (!this.synth) return;

        // Load voices (async in some browsers)
        if (this.synth.onvoiceschanged !== undefined) {
            this.synth.onvoiceschanged = () => {
                this.voicesLoaded = true;
            };
        }

        // Try loading immediately too
        const voices = this.synth.getVoices();
        if (voices.length > 0) {
            this.voicesLoaded = true;
        }

        console.log('🔊 VoiceGuide: Initialized');
    }

    /**
     * Update voice settings
     */
    static setSettings(settings: Partial<VoiceSettings>) {
        this.settings = { ...this.settings, ...settings };
        console.log(`🔊 VoiceGuide: Settings updated - Language: ${this.settings.language}`);
    }

    /**
     * Get current settings
     */
    static getSettings(): VoiceSettings {
        return { ...this.settings };
    }

    /**
     * Toggle language between English and Tamil
     */
    static toggleLanguage(): Language {
        this.settings.language = this.settings.language === 'en' ? 'ta' : 'en';
        this.speak(
            this.settings.language === 'ta'
                ? 'Tamil voice activated'
                : 'English voice activated',
            this.settings.language === 'ta'
                ? 'தமிழ் குரல் செயல்படுத்தப்பட்டது'
                : 'English voice activated'
        );
        return this.settings.language;
    }

    /**
     * Speak text with language selection
     */
    static speak(englishText: string, tamilText?: string) {
        if (!this.synth || !this.settings.enabled) return;

        // Cancel any ongoing speech
        this.synth.cancel();

        const text = this.settings.language === 'ta' && tamilText ? tamilText : englishText;
        const utterance = new SpeechSynthesisUtterance(text);

        // Configure voice
        const voices = this.synth.getVoices();

        if (this.settings.language === 'ta') {
            // Try Tamil voice, fallback to Hindi, then English Indian
            const tamilVoice = voices.find(v => v.lang.includes('ta'));
            const hindiVoice = voices.find(v => v.lang.includes('hi-IN'));
            const indianEnglish = voices.find(v => v.lang.includes('en-IN'));
            utterance.voice = tamilVoice || hindiVoice || indianEnglish || null;
        } else {
            // English - prefer Indian English for local names
            const indianEnglish = voices.find(v => v.lang === 'en-IN');
            const defaultEnglish = voices.find(v => v.lang.startsWith('en'));
            utterance.voice = indianEnglish || defaultEnglish || null;
        }

        // Apply settings
        utterance.rate = this.settings.rate;
        utterance.pitch = this.settings.pitch;
        utterance.volume = this.settings.volume;

        this.synth.speak(utterance);
    }

    /**
     * Stop speaking
     */
    static stop() {
        if (this.synth) {
            this.synth.cancel();
        }
    }

    /**
     * Announce navigation instruction
     */
    static announceInstruction(instruction: { text: string; tamil: string; distance: number }) {
        const distanceText = this.formatDistance(instruction.distance);
        const distanceTamil = this.formatDistanceTamil(instruction.distance);

        this.speak(
            `In ${distanceText}, ${instruction.text}`,
            `${distanceTamil} தூரத்தில், ${instruction.tamil}`
        );
    }

    /**
     * Announce turn instruction
     */
    static announceTurn(direction: 'left' | 'right' | 'straight' | 'uturn', roadName?: string) {
        const directions = {
            left: { en: 'Turn left', ta: 'இடது புறம் திரும்பவும்' },
            right: { en: 'Turn right', ta: 'வலது புறம் திரும்பவும்' },
            straight: { en: 'Continue straight', ta: 'நேராக செல்லவும்' },
            uturn: { en: 'Make a U-turn', ta: 'திரும்பி செல்லவும்' }
        };

        const dir = directions[direction];
        const road = roadName ? ` onto ${roadName}` : '';
        const roadTamil = roadName ? ` ${roadName} சாலையில்` : '';

        this.speak(dir.en + road, dir.ta + roadTamil);
    }

    /**
     * Announce hill-specific alerts
     */
    static announceHillAlert(type: string) {
        const alerts: Record<string, { en: string; ta: string }> = {
            'HAIRPIN': {
                en: 'Caution: Sharp hairpin bend ahead. Stay in your lane and use horn.',
                ta: 'எச்சரிக்கை: கொண்டை ஊசி வளைவு உள்ளது. உங்கள் பாதையில் நிலைத்திருங்கள், ஹார்ன் அடிக்கவும்.'
            },
            'HAIRPIN_ZONE': {
                en: 'Entering hairpin bend zone. Multiple sharp turns ahead.',
                ta: 'கொண்டை ஊசி வளைவு பகுதிக்குள் நுழைகிறீர்கள். பல கூர்மையான திருப்பங்கள் உள்ளன.'
            },
            'STEEP_CLIMB': {
                en: 'Steep climb ahead. Shift to lower gear for engine power.',
                ta: 'செங்குத்தான ஏற்றம். என்ஜின் சக்திக்காக குறைந்த கியருக்கு மாறவும்.'
            },
            'STEEP_DESCENT': {
                en: 'Steep descent ahead. Use engine braking. Do not ride brakes continuously.',
                ta: 'செங்குத்தான இறக்கம். என்ஜின் பிரேக்கிங் பயன்படுத்தவும். தொடர்ந்து பிரேக் பிடிக்க வேண்டாம்.'
            },
            'BRAKE_WARNING': {
                en: 'Warning: Your brakes may be heating up. Stop safely and let them cool.',
                ta: 'எச்சரிக்கை: உங்கள் பிரேக்குகள் சூடாகி இருக்கலாம். பாதுகாப்பாக நிறுத்தி குளிர விடுங்கள்.'
            },
            'FOG_ZONE': {
                en: 'Fog zone ahead. Visibility may drop. Switch on fog lights and drive slowly.',
                ta: 'மூடுபனி பகுதி. பார்வை குறையும். பனி விளக்குகளை ஒளிரவிடுங்கள், மெதுவாக ஓட்டுங்கள்.'
            },
            'WILDLIFE': {
                en: 'Wildlife zone. Watch for animals crossing. Do not stop or honk.',
                ta: 'வனவிலங்கு பகுதி. விலங்குகள் கடக்கும். நிற்க வேண்டாம், ஹார்ன் அடிக்க வேண்டாம்.'
            },
            'ACCIDENT_PRONE': {
                en: 'Accident-prone area. Drive with extreme caution.',
                ta: 'விபத்து அதிகம் நிகழும் பகுதி. மிகுந்த எச்சரிக்கையுடன் ஓட்டவும்.'
            }
        };

        const alert = alerts[type];
        if (alert) {
            this.speak(alert.en, alert.ta);
        }
    }

    /**
     * Announce arrival at destination
     */
    static announceArrival(placeName: string, tamilName?: string) {
        const tamilPlaceName = tamilName || placeName;
        this.speak(
            `You have arrived at ${placeName}. Please look for authorized parking.`,
            `${tamilPlaceName} வந்துவிட்டீர்கள். அங்கீகரிக்கப்பட்ட வாகன நிறுத்துமிடத்தைத் தேடவும்.`
        );
    }

    /**
     * Announce rerouting
     */
    static announceReroute(reason: string) {
        const reasons: Record<string, { en: string; ta: string }> = {
            'CROWD': {
                en: 'Rerouting due to high crowd at destination.',
                ta: 'இலக்கில் அதிக கூட்டம் காரணமாக மாற்று வழி.'
            },
            'TRAFFIC': {
                en: 'Rerouting to avoid heavy traffic ahead.',
                ta: 'முன்னால் உள்ள போக்குவரத்து நெரிசலைத் தவிர்க்க மாற்று வழி.'
            },
            'PARKING': {
                en: 'Rerouting. Parking full at destination. Finding alternative.',
                ta: 'மாற்று வழி. இலக்கில் வாகன நிறுத்துமிடம் நிரம்பியது. மாற்று தேடுகிறேன்.'
            },
            'ROAD_CLOSED': {
                en: 'Road ahead is closed. Finding alternative route.',
                ta: 'முன்னால் உள்ள சாலை மூடப்பட்டுள்ளது. மாற்று வழி தேடுகிறேன்.'
            }
        };

        const r = reasons[reason] || { en: 'Rerouting...', ta: 'மாற்று வழி...' };
        this.speak(r.en, r.ta);
    }

    /**
     * Announce ETA
     */
    static announceETA(minutes: number) {
        if (minutes < 1) {
            this.speak('Arriving in less than a minute', 'ஒரு நிமிடத்திற்குள் வந்துவிடுவீர்கள்');
        } else if (minutes === 1) {
            this.speak('Arriving in 1 minute', 'ஒரு நிமிடத்தில் வந்துவிடுவீர்கள்');
        } else {
            this.speak(
                `Arriving in ${minutes} minutes`,
                `${minutes} நிமிடங்களில் வந்துவிடுவீர்கள்`
            );
        }
    }

    /**
     * Format distance in human-readable form (English)
     */
    private static formatDistance(meters: number): string {
        if (meters < 100) {
            return `${Math.round(meters)} meters`;
        } else if (meters < 1000) {
            return `${Math.round(meters / 100) * 100} meters`;
        } else {
            return `${(meters / 1000).toFixed(1)} kilometers`;
        }
    }

    /**
     * Format distance in human-readable form (Tamil)
     */
    private static formatDistanceTamil(meters: number): string {
        if (meters < 100) {
            return `${Math.round(meters)} மீட்டர்`;
        } else if (meters < 1000) {
            return `${Math.round(meters / 100) * 100} மீட்டர்`;
        } else {
            return `${(meters / 1000).toFixed(1)} கிலோமீட்டர்`;
        }
    }
}

export default VoiceGuide;
