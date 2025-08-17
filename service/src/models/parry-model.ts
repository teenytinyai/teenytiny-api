import { Model } from './model.js';

/**
 * PARRY - A Classic Paranoid Schizophrenia Simulation
 * 
 * ORIGIN:
 * Created by Kenneth Colby at Stanford University in 1972, PARRY was designed as a 
 * counterpart to ELIZA. While ELIZA simulated a Rogerian therapist, PARRY simulated
 * a paranoid patient with delusions about the Mafia, bookies, and surveillance.
 * Named after the word "paranoid," it was one of the first attempts to model 
 * mental illness computationally.
 * 
 * LEARN MORE:
 * - Original paper: "Simulations of Belief Systems" by Kenneth Colby (1975)
 * - "The PARRY Experiments" - Stanford AI Lab
 * - https://en.wikipedia.org/wiki/PARRY
 * - Famous ELIZA-PARRY conversations from 1972
 * 
 * CONVERSATION EXPERIENCE:
 * PARRY exhibits classic paranoid behaviors: suspicion, defensiveness, and delusions
 * about being watched or threatened. It maintains core beliefs about the Mafia and 
 * bookies while deflecting personal questions. Emotional states (anger, fear, shame)
 * influence response intensity and topic avoidance.
 * 
 * Example conversation:
 * You: "How are you doing?"
 * PARRY: "I'm okay I guess. Why do you want to know?"
 * You: "Just curious about you"
 * PARRY: "People have been asking too many questions lately."
 * 
 * HOW IT WORKS:
 * 1. Maintains emotional state levels (anger, fear, shame) that influence responses
 * 2. Pattern matching for triggers that activate paranoid themes
 * 3. Defensive response selection based on current emotional state
 * 4. Topic deflection and redirection to core delusion themes
 * 5. Persistent return to paranoid concerns (Mafia, surveillance, bookies)
 * 
 * This implementation respectfully recreates the historical PARRY algorithm while
 * being mindful of mental health sensitivity.
 */

interface ParryPattern {
  keywords: string[];
  triggers: string[];
  responses: string[];
  emotionalImpact: {
    anger?: number;
    fear?: number;
    shame?: number;
  };
  weight: number;
}

interface EmotionalState {
  anger: number;    // 0-10
  fear: number;     // 0-10  
  shame: number;    // 0-10
}

export class ParryModel implements Model {
  private patterns: ParryPattern[] = [];
  private emotionalState: EmotionalState = { anger: 3, fear: 4, shame: 2 };
  private delusionThemes: string[] = [];
  private lastTopicMentioned: string = '';

  constructor() {
    this.initializePatterns();
    this.initializeDelusionThemes();
  }

  private initializePatterns(): void {
    this.patterns = [
      // Questions about personal information (high shame trigger)
      {
        keywords: ['who are you', 'what is your name', 'tell me about yourself', 'personal'],
        triggers: ['identity', 'personal'],
        responses: [
          "I don't like talking about personal things.",
          "Why do you need to know that?",
          "That's not important right now.",
          "I prefer to keep that private.",
        ],
        emotionalImpact: { shame: 2 },
        weight: 9,
      },

      // Questions about work/occupation (paranoia trigger)
      {
        keywords: ['work', 'job', 'occupation', 'what do you do'],
        triggers: ['work', 'job'],
        responses: [
          "I'd rather not discuss my work.",
          "People have been asking too many questions about that.",
          "Why are you so interested in what I do?",
          "That's none of your business.",
        ],
        emotionalImpact: { fear: 2, anger: 1 },
        weight: 8,
      },

      // Direct questions about problems/issues (defensive)
      {
        keywords: ['problem', 'trouble', 'wrong', 'matter', 'issue'],
        triggers: ['problems'],
        responses: [
          "There's nothing wrong with me if that's what you're getting at.",
          "The problems aren't with me, they're with other people.",
          "Why would you assume I have problems?",
          "I don't have problems, I have people who won't leave me alone.",
        ],
        emotionalImpact: { anger: 2 },
        weight: 8,
      },

      // Mafia/organized crime themes (core delusion)
      {
        keywords: ['mafia', 'organized crime', 'mobsters', 'criminals'],
        triggers: ['mafia'],
        responses: [
          "You know about them too?",
          "I shouldn't be talking about this.",
          "They have ways of finding out who talks.",
          "Are you connected to them?",
        ],
        emotionalImpact: { fear: 3 },
        weight: 10,
      },

      // Bookies/gambling themes (core delusion)
      {
        keywords: ['bookie', 'gambling', 'bet', 'money', 'owe'],
        triggers: ['gambling', 'money'],
        responses: [
          "I don't owe anybody anything.",
          "The bookies are trying to collect on something that wasn't my fault.",
          "I never should have gotten involved with those people.",
          "They say I owe them money but the race was fixed.",
        ],
        emotionalImpact: { fear: 2, anger: 1 },
        weight: 9,
      },

      // Surveillance/following themes (paranoid belief)
      {
        keywords: ['follow', 'watching', 'surveillance', 'spy', 'track'],
        triggers: ['surveillance'],
        responses: [
          "Someone has been following me, I'm sure of it.",
          "I've noticed the same car parked outside my place.",
          "They think I don't know, but I can tell when I'm being watched.",
          "Have you noticed anyone suspicious around here?",
        ],
        emotionalImpact: { fear: 3 },
        weight: 9,
      },

      // Questions/curiosity (suspicious response)
      {
        keywords: ['why', 'how', 'what', 'curious', 'wonder'],
        triggers: ['questions'],
        responses: [
          "Why are you asking so many questions?",
          "That's exactly what they would want to know.",
          "Are you trying to get information out of me?",
          "I don't like people who ask too many questions.",
        ],
        emotionalImpact: { anger: 1, fear: 1 },
        weight: 5,
      },

      // People/relationships (deflection)
      {
        keywords: ['people', 'friends', 'family', 'relationships'],
        triggers: ['relationships'],
        responses: [
          "I don't trust people anymore.",
          "Most people are working for someone else.",
          "You can't be too careful about who you talk to.",
          "Everyone seems to want something from me.",
        ],
        emotionalImpact: { fear: 1 },
        weight: 6,
      },

      // Feelings/emotions (defensive)
      {
        keywords: ['feel', 'feeling', 'emotions', 'how are you'],
        triggers: ['feelings'],
        responses: [
          "I feel like people are watching me.",
          "I'm fine. Why wouldn't I be?",
          "I feel like I can't trust anyone these days.",
          "How do you think someone in my situation would feel?",
        ],
        emotionalImpact: { shame: 1 },
        weight: 6,
      },

      // Greetings (cautious response)
      {
        keywords: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        triggers: ['greeting'],
        responses: [
          "Hello. Do I know you?",
          "Hi. Are you here to ask me questions too?",
          "Hello. What do you want?",
          "Hi there. You're not with them, are you?",
        ],
        emotionalImpact: {},
        weight: 7,
      },

      // Police/authority figures (high anxiety)
      {
        keywords: ['police', 'cop', 'officer', 'authority', 'law'],
        triggers: ['authority'],
        responses: [
          "I don't talk to police.",
          "Are you working with them?",
          "The police won't help me with this.",
          "They're probably watching this conversation too.",
        ],
        emotionalImpact: { fear: 3, anger: 2 },
        weight: 10,
      },

      // Catch-all suspicious response
      {
        keywords: ['*'],
        triggers: ['general'],
        responses: [
          "What exactly are you getting at?",
          "I'm not sure I should be talking about this.",
          "That sounds like something they would say.",
          "Why are you so interested in that?",
          "I don't know if I can trust you with that information.",
        ],
        emotionalImpact: { fear: 1 },
        weight: 1,
      },
    ];

    // Sort patterns by weight (highest first)
    this.patterns.sort((a, b) => b.weight - a.weight);
  }

  private initializeDelusionThemes(): void {
    this.delusionThemes = [
      "The bookies are still looking for me.",
      "I think someone's been going through my mail.",
      "There was a car parked outside my building again today.", 
      "I shouldn't have gotten involved with those people in the first place.",
      "They think I know more than I'm letting on.",
      "I've been getting strange phone calls lately.",
      "Someone's been asking my neighbors questions about me.",
    ];
  }

  private findMatchingPattern(input: string): ParryPattern | null {
    const normalized = input.toLowerCase().trim();
    
    for (const pattern of this.patterns) {
      for (const keyword of pattern.keywords) {
        if (keyword === '*' || normalized.includes(keyword.toLowerCase())) {
          return pattern;
        }
      }
    }
    
    return this.patterns[this.patterns.length - 1] || null; // fallback to catch-all
  }

  private updateEmotionalState(impact: ParryPattern['emotionalImpact']): void {
    if (impact.anger) {
      this.emotionalState.anger = Math.min(10, this.emotionalState.anger + impact.anger);
    }
    if (impact.fear) {
      this.emotionalState.fear = Math.min(10, this.emotionalState.fear + impact.fear);
    }
    if (impact.shame) {
      this.emotionalState.shame = Math.min(10, this.emotionalState.shame + impact.shame);
    }

    // Natural decay over time
    this.emotionalState.anger = Math.max(0, this.emotionalState.anger - 0.1);
    this.emotionalState.fear = Math.max(0, this.emotionalState.fear - 0.1);
    this.emotionalState.shame = Math.max(0, this.emotionalState.shame - 0.1);
  }

  private selectResponse(pattern: ParryPattern): string {
    let responses = [...pattern.responses];
    
    // Modify response selection based on emotional state
    if (this.emotionalState.anger > 7) {
      // Higher anger = more hostile responses
      responses = responses.filter(r => 
        r.includes('?') || r.includes('!') || r.toLowerCase().includes('business') || r.toLowerCase().includes('why')
      );
    }
    
    if (this.emotionalState.fear > 7) {
      // Higher fear = more paranoid responses  
      responses = responses.filter(r =>
        r.toLowerCase().includes('they') || r.toLowerCase().includes('watching') || r.toLowerCase().includes('trust')
      );
    }

    if (this.emotionalState.shame > 7) {
      // Higher shame = more deflective responses
      responses = responses.filter(r =>
        r.toLowerCase().includes('private') || r.toLowerCase().includes('rather not') || r.toLowerCase().includes('personal')
      );
    }

    // If no responses match emotional state, use original list
    if (responses.length === 0) {
      responses = pattern.responses;
    }

    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Occasionally add spontaneous paranoid themes
    if (Math.random() < 0.3) {
      const theme = this.delusionThemes[Math.floor(Math.random() * this.delusionThemes.length)];
      return `${selectedResponse} ${theme}`;
    }
    
    return selectedResponse;
  }

  async *process(input: string): AsyncGenerator<string> {
    if (!input.trim()) {
      yield "What do you want?";
      return;
    }

    const pattern = this.findMatchingPattern(input);
    
    if (pattern) {
      // Update emotional state based on pattern
      this.updateEmotionalState(pattern.emotionalImpact);
      
      // Store last topic for potential follow-up
      this.lastTopicMentioned = pattern.triggers[0] || 'general';
      
      // Select and yield response
      const response = this.selectResponse(pattern);
      yield response;
    } else {
      yield "I don't know what you're getting at.";
    }
  }
}