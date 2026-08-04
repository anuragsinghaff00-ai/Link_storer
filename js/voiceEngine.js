/**
 * VoiceEngine - Handles Text-to-Speech (TTS), Speech-to-Text (STT), Wake Word, and Settings.
 */

export class VoiceEngine {
  constructor(onWakeWord, onCommand, onInterruption) {
    this.settingsKey = "jarvis_voice_settings_v1";
    this.settings = this.loadSettings();

    this.onWakeWord = onWakeWord;
    this.onCommand = onCommand;
    this.onInterruption = onInterruption; // Stop, Pause, Continue

    this.isListening = false;
    this.isSpeaking = false;

    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.voices = [];

    this.initSTT();
    this.initTTS();
  }

  loadSettings() {
    const defaults = {
      enabled: true,
      alwaysListening: false,
      wakeWord: "hey jarvis",
      wakeWordEnabled: true,
      voiceURI: "",
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0
    };
    try {
      const stored = localStorage.getItem(this.settingsKey);
      if (stored) return { ...defaults, ...JSON.parse(stored) };
    } catch (e) {
      console.error("Error loading voice settings:", e);
    }
    return defaults;
  }

  saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
    this.applySettingsToSTT();
  }

  initTTS() {
    const populateVoices = () => {
      this.voices = this.synthesis.getVoices();
    };
    populateVoices();
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = populateVoices;
    }
  }

  initSTT() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition API not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.applySettingsToSTT();

    this.recognition.onstart = () => {
      this.isListening = true;
      document.dispatchEvent(new CustomEvent("jarvis-listening-state", { detail: true }));
    };

    this.recognition.onresult = (e) => {
      let finalTranscript = "";
      for (let i = e.resultIndex; i < e.results.length; ++i) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        this.processTranscript(finalTranscript.trim().toLowerCase());
      }
    };

    this.recognition.onerror = (e) => {
      console.error("SpeechRecognition error:", e.error);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      document.dispatchEvent(new CustomEvent("jarvis-listening-state", { detail: false }));
      
      // Auto-restart if always listening is enabled
      if (this.settings.enabled && this.settings.alwaysListening) {
        try {
          this.recognition.start();
        } catch(e) {}
      }
    };
  }

  applySettingsToSTT() {
    if (!this.recognition) return;
    this.recognition.continuous = this.settings.alwaysListening;
    this.recognition.interimResults = false; // Only trigger on final sentences
  }

  toggleAlwaysListening(forceState) {
    if (!this.recognition) return;
    if (forceState !== undefined) {
      this.settings.alwaysListening = forceState;
    }

    if (this.settings.alwaysListening) {
      if (!this.isListening) this.recognition.start();
    } else {
      if (this.isListening) this.recognition.stop();
    }
    this.applySettingsToSTT();
  }

  processTranscript(text) {
    // Check interruptions first
    if (text === "stop" || text === "pause" || text === "shut up") {
      this.stopSpeaking();
      if (this.onInterruption) this.onInterruption(text);
      return;
    }

    // Wake word logic
    if (this.settings.wakeWordEnabled) {
      const wake = this.settings.wakeWord.toLowerCase();
      if (text.startsWith(wake)) {
        const command = text.replace(wake, "").trim();
        if (command) {
          this.onCommand(command);
        } else {
          this.onWakeWord();
        }
        return;
      } else if (!this.settings.alwaysListening) {
        // If push-to-talk, treat anything said as a command
        this.onCommand(text);
        return;
      }
    } else {
      // If wake word disabled, every transcript is a command
      this.onCommand(text);
    }
  }

  speak(text) {
    if (!this.settings.enabled || !this.synthesis) return;
    this.stopSpeaking();

    // Clean text: remove markdown formatting for speech
    const cleanText = text
      .replace(/[#*_~`]/g, "")
      .replace(/🟢|🟡|🔴|⚪|🗑️|⭐|🔗|📋|ℹ️/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Extract link text
      .trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Apply Settings
    utterance.rate = this.settings.speed;
    utterance.pitch = this.settings.pitch;
    utterance.volume = this.settings.volume;

    if (this.settings.voiceURI && this.voices.length > 0) {
      const selectedVoice = this.voices.find(v => v.voiceURI === this.settings.voiceURI);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      document.dispatchEvent(new CustomEvent("jarvis-speaking-state", { detail: true }));
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      document.dispatchEvent(new CustomEvent("jarvis-speaking-state", { detail: false }));
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      document.dispatchEvent(new CustomEvent("jarvis-speaking-state", { detail: false }));
      console.error("SpeechSynthesis error:", e);
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      document.dispatchEvent(new CustomEvent("jarvis-speaking-state", { detail: false }));
    }
  }

  // Quick manual trigger for Push-to-talk
  triggerListen() {
    if (!this.recognition) return;
    if (this.isListening) {
      this.recognition.stop();
    } else {
      try {
        this.recognition.start();
      } catch(e) {}
    }
  }
}

// Global default instance created, but will be wired up in app.js
export const voiceEngine = new VoiceEngine(
  () => console.log("Wake word detected"),
  (cmd) => console.log("Voice Command:", cmd),
  (int) => console.log("Interruption:", int)
);
