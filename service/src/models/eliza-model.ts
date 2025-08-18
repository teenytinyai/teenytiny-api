import { Model } from './model.js';

/**
 * ELIZA - A Classic Rogerian Psychotherapist Chatbot
 * 
 * ORIGIN:
 * Created by Joseph Weizenbaum at MIT between 1964-1966, ELIZA was one of the first
 * chatbot programs and demonstrated how simple pattern matching could create convincing
 * conversational interactions. Named after Eliza Doolittle from Pygmalion, who learned
 * to speak with proper pronunciation.
 * 
 * LEARN MORE:
 * - Original paper: "ELIZA—a computer program for the study of natural language communication"
 * - Weizenbaum's book: "Computer Power and Human Reason" (1976)
 * - https://en.wikipedia.org/wiki/ELIZA
 * - https://web.stanford.edu/class/linguist238/p36-weizen.pdf
 * 
 * CONVERSATION EXPERIENCE:
 * ELIZA simulates a Rogerian psychotherapist by reflecting your statements back as questions.
 * It listens for keywords about family, emotions, and relationships, then responds with
 * therapeutic-sounding phrases. The "ELIZA effect" describes how users often attribute
 * more understanding to the program than it actually possesses.
 * 
 * Example conversation:
 * You: "I am feeling sad about my mother"
 * ELIZA: "Why are you feeling sad about your mother?"
 * You: "She doesn't understand me"
 * ELIZA: "Tell me more about your family"
 * 
 * HOW IT WORKS:
 * 1. Scans input for keyword patterns (weighted by psychological relevance)
 * 2. Extracts context around matched keywords
 * 3. Applies word reflections (I→you, me→you, my→your)
 * 4. Substitutes reflected text into response templates
 * 5. Falls back to generic responses when no patterns match
 * 
 * This implementation captures the essence of the original ELIZA algorithm with
 * classic patterns focused on family, emotions, and self-reflection.
 */

interface Pattern {
  keyword: string;
  regex: RegExp;
  responses: string[];
  weight: number;
}

interface Reflection {
  from: string;
  to: string;
}

export class ElizaModel implements Model {
  private patterns: Pattern[] = [];
  private reflections: Reflection[] = [];
  private fallbackResponses: string[] = [];

  constructor() {
    this.initializePatterns();
    this.initializeReflections();
    this.initializeFallbacks();
  }

  private initializePatterns(): void {
    this.patterns = [
      // Apologies (highest priority)
      {
        keyword: 'sorry',
        regex: /.*\b(sorry|apologize)\b.*/i,
        responses: [
          'Please don\'t apologize.',
          'No need to be sorry.',
          'Apologies are not necessary here.',
        ],
        weight: 11,
      },

      // Memory and reminiscence (high priority)
      {
        keyword: 'i remember',
        regex: /.*\bi remember (.*)$/i,
        responses: [
          'Do you often think of {context}?',
          'What makes you remember {context}?',
          'Does thinking of {context} bring anything else to mind?',
          'Why do you think you remember {context} now?',
        ],
        weight: 10,
      },

      // Family relationships (high priority)
      {
        keyword: 'mother',
        regex: /.*\b(mother|mom|ma)\b.*/i,
        responses: [
          'Tell me more about your mother.',
          'What was your relationship with your mother like?',
          'How do you feel about your mother?',
          'Why do you mention your mother?',
        ],
        weight: 10,
      },
      {
        keyword: 'father',
        regex: /.*\b(father|dad|papa)\b.*/i,
        responses: [
          'Tell me more about your father.',
          'How did your father make you feel?',
          'What was your father like?',
          'Why do you mention your father?',
        ],
        weight: 10,
      },
      {
        keyword: 'family',
        regex: /.*\b(family|parents|relatives)\b.*/i,
        responses: [
          'Tell me more about your family.',
          'How is your relationship with your family?',
          'What role does your family play in your life?',
        ],
        weight: 9,
      },
      {
        keyword: 'sibling',
        regex: /.*\b(brother|sister|sibling)\b.*/i,
        responses: [
          'Tell me about your siblings.',
          'How do you get along with your family?',
          'What are your siblings like?',
        ],
        weight: 8,
      },

      // Feelings with context capture (high priority)
      {
        keyword: 'i feel',
        regex: /.*\bi feel (.*)$/i,
        responses: [
          'Why do you feel {context}?',
          'Do you often feel {context}?',
          'What led you to feel {context}?',
          'Tell me more about feeling {context}.',
        ],
        weight: 9,
      },

      // Causality (high priority)
      {
        keyword: 'because',
        regex: /.*\bbecause (.*)$/i,
        responses: [
          'Is that the real reason?',
          'What other reasons come to mind?',
          'Does that reason apply to anything else?',
          'Are you certain that {context} is why?',
        ],
        weight: 8,
      },

      // Questions about the therapist (high priority)
      {
        keyword: 'can you',
        regex: /.*\bcan you (.*)$/i,
        responses: [
          'What makes you ask if I can {context}?',
          'Perhaps you can {context}?',
          'Do you think I should {context}?',
          'Why is it important whether I can {context}?',
        ],
        weight: 8,
      },
      {
        keyword: 'you',
        regex: /.*\byou (.*)$/i,
        responses: [
          'We were discussing you, not me.',
          'Why do you think I {context}?',
          'What makes you believe I {context}?',
        ],
        weight: 7,
      },

      // Self-reference patterns (medium-high priority)
      {
        keyword: 'i am',
        regex: /.*\bi am (.*)$/i,
        responses: [
          'How long have you been {context}?',
          'Why do you say you are {context}?',
          'How do you feel about being {context}?',
          'What does being {context} mean to you?',
        ],
        weight: 7,
      },
      {
        keyword: 'i think',
        regex: /.*\bi think (.*)$/i,
        responses: [
          'Why do you think {context}?',
          'What makes you think {context}?',
          'Do you doubt that {context}?',
        ],
        weight: 6,
      },
      {
        keyword: 'i want',
        regex: /.*\bi want (.*)$/i,
        responses: [
          'What would it mean to you if you got {context}?',
          'Why do you want {context}?',
          'What if you never got {context}?',
        ],
        weight: 6,
      },
      {
        keyword: 'i need',
        regex: /.*\bi need (.*)$/i,
        responses: [
          'Why do you need {context}?',
          'What would happen if you didn\'t get {context}?',
          'How important is {context} to you?',
        ],
        weight: 6,
      },

      // Emotions (medium priority)
      {
        keyword: 'sad',
        regex: /.*\b(sad|depressed|unhappy|down)\b.*/i,
        responses: [
          'Why are you feeling sad?',
          'How long have you been feeling this way?',
          'What makes you feel sad?',
          'Tell me more about these feelings.',
        ],
        weight: 6,
      },
      {
        keyword: 'angry',
        regex: /.*\b(angry|mad|furious|upset)\b.*/i,
        responses: [
          'What makes you feel angry?',
          'Why are you upset about that?',
          'How do you deal with feeling angry?',
        ],
        weight: 6,
      },
      {
        keyword: 'happy',
        regex: /.*\b(happy|glad|pleased|joyful)\b.*/i,
        responses: [
          'What makes you happy?',
          'Tell me more about this happy feeling.',
          'Why does that make you feel good?',
        ],
        weight: 5,
      },

      // Questions (medium priority)
      {
        keyword: 'why',
        regex: /.*\bwhy (.*)$/i,
        responses: [
          'What do you think?',
          'Does that question interest you?',
          'Why do you ask about {context}?',
        ],
        weight: 4,
      },

      // Dreams (medium priority)
      {
        keyword: 'dream',
        regex: /.*\b(dream|dreams|nightmare)\b.*/i,
        responses: [
          'What does that dream suggest to you?',
          'Do you dream often?',
          'What persons appear in your dreams?',
          'How do you feel about that dream?',
        ],
        weight: 5,
      },

      // Conversation management (low priority)
      {
        keyword: 'yes',
        regex: /^\s*(yes|yeah|yep|sure|okay|ok)\s*$/i,
        responses: [
          'Why do you think so?',
          'Can you be more specific?',
          'Tell me more.',
        ],
        weight: 2,
      },
      {
        keyword: 'no',
        regex: /^\s*(no|nope|not really)\s*$/i,
        responses: [
          'Why not?',
          'Are you sure?',
          'What makes you say that?',
        ],
        weight: 2,
      },
      {
        keyword: 'hello',
        regex: /.*\b(hello|hi|hey)\b.*/i,
        responses: [
          'Hello. How are you feeling today?',
          'Hi there. What brings you here?',
          'Hello. What would you like to talk about?',
        ],
        weight: 3,
      },
      {
        keyword: 'goodbye',
        regex: /.*\b(goodbye|bye|see you)\b.*/i,
        responses: [
          'Goodbye. Take care.',
          'Thank you for talking with me.',
          'Goodbye. I hope our conversation was helpful.',
        ],
        weight: 3,
      },

      // Catch-all pattern (lowest priority)
      {
        keyword: 'catchall',
        regex: /(.*)/i,
        responses: [
          'Please tell me more.',
          'Can you elaborate on that?',
          'How does that make you feel?',
          'Why do you say {context}?',
          'What does that suggest to you?',
        ],
        weight: 1,
      },
    ];

    // Sort patterns by weight (highest first)
    this.patterns.sort((a, b) => b.weight - a.weight);
  }

  private initializeReflections(): void {
    this.reflections = [
      { from: 'i am', to: 'you are' },
      { from: "i'm", to: 'you are' },
      { from: 'i was', to: 'you were' },
      { from: 'i', to: 'you' },
      { from: 'me', to: 'you' },
      { from: 'my', to: 'your' },
      { from: 'myself', to: 'yourself' },
      { from: 'mine', to: 'yours' },
      { from: 'you are', to: 'I am' },
      { from: "you're", to: 'I am' },
      { from: 'you were', to: 'I was' },
      { from: 'you', to: 'I' },
      { from: 'your', to: 'my' },
      { from: 'yourself', to: 'myself' },
      { from: 'yours', to: 'mine' },
    ];
  }

  private initializeFallbacks(): void {
    this.fallbackResponses = [
      'Tell me more about that.',
      'How does that make you feel?',
      'Can you elaborate on that?',
      'What do you think about that?',
      'Go on...',
      'Please continue.',
      'I see. What else?',
      'That\'s interesting. Tell me more.',
      'What comes to mind when you think about that?',
    ];
  }


  private applyReflections(text: string): string {
    let result = text;
    
    // Apply reflections in order (longer phrases first)
    const sortedReflections = this.reflections.sort((a, b) => b.from.length - a.from.length);
    
    for (const reflection of sortedReflections) {
      const regex = new RegExp(`\\b${reflection.from}\\b`, 'gi');
      result = result.replace(regex, `__${reflection.to}__`);
    }
    
    // Remove temporary markers
    result = result.replace(/__/g, '');
    
    return result;
  }

  private findMatchingPattern(input: string): { pattern: Pattern; context: string } | null {
    const trimmed = input.trim();
    
    for (const pattern of this.patterns) {
      const match = pattern.regex.exec(trimmed);
      if (match) {
        // Extract captured group (if any) for context
        const context = match[1] ? match[1].trim() : trimmed;
        return { pattern, context };
      }
    }
    
    return null;
  }

  private generateResponse(pattern: Pattern, context: string): string {
    // Select a random response template
    const template = pattern.responses[Math.floor(Math.random() * pattern.responses.length)]!;
    
    if (template.includes('{context}')) {
      // Apply reflections to context before substitution
      const reflectedContext = this.applyReflections(context);
      return template.replace(/\{context\}/g, reflectedContext || 'that');
    }
    
    return template;
  }

  async *process(input: string): AsyncGenerator<string> {
    if (!input.trim()) {
      yield this.fallbackResponses[0]!;
      return;
    }

    const match = this.findMatchingPattern(input);
    
    if (match) {
      const response = this.generateResponse(match.pattern, match.context);
      yield response;
    } else {
      // Use a random fallback response
      const fallback = this.fallbackResponses[Math.floor(Math.random() * this.fallbackResponses.length)]!;
      yield fallback;
    }
  }
}