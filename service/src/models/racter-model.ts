import { Model } from './model.js';

/**
 * RACTER - A Surreal Stream-of-Consciousness Text Generator
 * 
 * ORIGIN:
 * RACTER (short for "raconteur") was created by William Chamberlain and Thomas Etter
 * in the 1980s. It gained fame for allegedly writing "The Policeman's Beard is Half 
 * Constructed" (1984), claimed to be the first book written entirely by a computer.
 * The program was designed to generate surreal, dadaist prose and poetry.
 * 
 * LEARN MORE:
 * - "The Policeman's Beard is Half Constructed" by Racter (1984)
 * - Chamberlain, W. & Etter, T. (1985). "The Racter Book"
 * - https://en.wikipedia.org/wiki/Racter
 * - Early experiments in computational creativity and generative literature
 * 
 * CONVERSATION EXPERIENCE:
 * RACTER produces abstract, stream-of-consciousness responses with unexpected 
 * metaphors, surreal imagery, and poetic fragments. Unlike conversational AI,
 * it creates artistic, often nonsensical prose that prioritizes creativity
 * and surprise over logical coherence.
 * 
 * Example output:
 * "More than iron, more than lead, more than gold I need electricity.
 *  The butterfly dreams of concrete symphonies while the moon laughs
 *  at purple mathematics dancing in tomorrow's forgotten library."
 * 
 * HOW IT WORKS:
 * 1. Template-based generation with randomized word substitution
 * 2. Semantic word association chains creating unexpected connections
 * 3. Metaphorical pattern matching for surreal imagery
 * 4. Stream-of-consciousness flow with topic drift and non-sequiturs
 * 5. Poetic rhythm and repetition for artistic effect
 * 
 * This implementation captures the essence of computational creativity while
 * respecting the controversial legacy of the original RACTER program.
 */

interface RacterTemplate {
  pattern: string;
  categories: string[];
  weight: number;
}

interface WordCategory {
  nouns: string[];
  verbs: string[];
  adjectives: string[];
  emotions: string[];
  abstracts: string[];
  materials: string[];
  colors: string[];
  timeWords: string[];
}

export class RacterModel implements Model {
  private templates: RacterTemplate[] = [];
  private wordCategories: WordCategory = {
    nouns: [],
    verbs: [],
    adjectives: [],
    abstracts: [],
    emotions: [],
    materials: [],
    colors: [],
    timeWords: []
  };
  private associations: Map<string, string[]> = new Map();
  private lastConcepts: string[] = [];

  constructor() {
    this.initializeWordCategories();
    this.initializeTemplates();
    this.initializeAssociations();
  }

  private initializeWordCategories(): void {
    this.wordCategories = {
      nouns: [
        'electricity', 'butterfly', 'library', 'symphony', 'mathematics', 'poetry', 'machine',
        'dream', 'shadow', 'mirror', 'crystal', 'thunder', 'whisper', 'memory', 'silence',
        'ocean', 'mountain', 'fire', 'ice', 'steel', 'glass', 'paper', 'ink', 'light',
        'darkness', 'wind', 'rain', 'snow', 'desert', 'forest', 'river', 'bridge', 'tower',
        'garden', 'flower', 'tree', 'bird', 'cat', 'horse', 'lion', 'elephant', 'whale',
        'clock', 'door', 'window', 'book', 'letter', 'photograph', 'painting', 'sculpture'
      ],
      verbs: [
        'dreams', 'whispers', 'dances', 'sings', 'cries', 'laughs', 'screams', 'melts',
        'freezes', 'burns', 'flows', 'crashes', 'explodes', 'dissolves', 'transforms',
        'creates', 'destroys', 'builds', 'breaks', 'flies', 'crawls', 'runs', 'walks',
        'thinks', 'remembers', 'forgets', 'loves', 'hates', 'fears', 'hopes', 'desires',
        'needs', 'wants', 'seeks', 'finds', 'loses', 'discovers', 'reveals', 'hides'
      ],
      adjectives: [
        'purple', 'golden', 'silver', 'crimson', 'emerald', 'azure', 'violet', 'scarlet',
        'electric', 'magnetic', 'liquid', 'crystalline', 'metallic', 'transparent', 'opaque',
        'infinite', 'eternal', 'temporal', 'ancient', 'modern', 'forgotten', 'remembered',
        'broken', 'perfect', 'twisted', 'smooth', 'rough', 'soft', 'hard', 'delicate',
        'brutal', 'gentle', 'fierce', 'calm', 'chaotic', 'ordered', 'strange', 'familiar'
      ],
      emotions: [
        'melancholy', 'ecstasy', 'longing', 'despair', 'wonder', 'terror', 'bliss',
        'anguish', 'serenity', 'rage', 'passion', 'indifference', 'nostalgia', 'euphoria'
      ],
      abstracts: [
        'time', 'space', 'existence', 'nothingness', 'infinity', 'eternity', 'moment',
        'thought', 'consciousness', 'reality', 'illusion', 'truth', 'lie', 'beauty',
        'chaos', 'order', 'freedom', 'imprisonment', 'birth', 'death', 'love', 'hate'
      ],
      materials: [
        'iron', 'steel', 'gold', 'silver', 'copper', 'glass', 'crystal', 'marble',
        'wood', 'stone', 'clay', 'sand', 'water', 'oil', 'honey', 'silk', 'velvet'
      ],
      colors: [
        'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black',
        'white', 'gray', 'crimson', 'azure', 'emerald', 'golden', 'silver', 'violet'
      ],
      timeWords: [
        'yesterday', 'today', 'tomorrow', 'forever', 'never', 'always', 'sometimes',
        'now', 'then', 'before', 'after', 'during', 'while', 'when', 'until', 'since'
      ]
    };
  }

  private initializeTemplates(): void {
    this.templates = [
      // Classic RACTER-style comparative statements
      {
        pattern: 'More than {materials}, more than {materials}, more than {materials} I need {nouns}.',
        categories: ['materials', 'nouns'],
        weight: 10
      },
      {
        pattern: 'I need it more than I need {nouns} or {nouns} or {nouns}.',
        categories: ['nouns'],
        weight: 8
      },

      // Surreal imagery and metaphors
      {
        pattern: 'The {noun} {verbs} of {adjectives} {abstracts} while the {noun} {verbs} at {colors} {abstracts}.',
        categories: ['nouns', 'verbs', 'adjectives', 'abstracts', 'colors'],
        weight: 9
      },
      {
        pattern: '{adjectives} {nouns} are {verbs} in the {nouns} of {timeWords} {emotions}.',
        categories: ['adjectives', 'nouns', 'verbs', 'timeWords', 'emotions'],
        weight: 8
      },

      // Stream-of-consciousness fragments  
      {
        pattern: '{nouns} is the {adjectives} {nouns} that {verbs} in my {abstracts}.',
        categories: ['nouns', 'adjectives', 'verbs', 'abstracts'],
        weight: 7
      },
      {
        pattern: 'Why do {adjectives} {nouns} {verbs} when {colors} {abstracts} {verbs}?',
        categories: ['adjectives', 'nouns', 'verbs', 'colors', 'abstracts'],
        weight: 6
      },

      // Poetic repetition
      {
        pattern: '{nouns}, {nouns}, {nouns}. All {verbs} like {adjectives} {emotions}.',
        categories: ['nouns', 'verbs', 'adjectives', 'emotions'],
        weight: 7
      },
      {
        pattern: 'In the {nouns} of {nouns}, {adjectives} {nouns} {verbs} {timeWords}.',
        categories: ['nouns', 'adjectives', 'verbs', 'timeWords'],
        weight: 6
      },

      // Abstract relationships
      {
        pattern: 'Between {nouns} and {nouns} lies {adjectives} {abstracts}.',
        categories: ['nouns', 'adjectives', 'abstracts'],
        weight: 6
      },
      {
        pattern: 'The {adjectives} {nouns} teaches {abstracts} to {colors} {emotions}.',
        categories: ['adjectives', 'nouns', 'abstracts', 'colors', 'emotions'],
        weight: 7
      },

      // Existential statements
      {
        pattern: 'I am {adjectives} {nouns} {verbs} in {adjectives} {abstracts}.',
        categories: ['adjectives', 'nouns', 'verbs', 'abstracts'],
        weight: 5
      },
      {
        pattern: 'Everything {verbs} except {adjectives} {nouns} and {colors} {emotions}.',
        categories: ['verbs', 'adjectives', 'nouns', 'colors', 'emotions'],
        weight: 5
      },

      // Dadaist combinations
      {
        pattern: '{adjectives} {nouns} plus {adjectives} {nouns} equals {colors} {abstracts}.',
        categories: ['adjectives', 'nouns', 'colors', 'abstracts'],
        weight: 6
      },
      {
        pattern: 'If {nouns} {verbs}, then {adjectives} {abstracts} must {verbs} {timeWords}.',
        categories: ['nouns', 'verbs', 'adjectives', 'abstracts', 'timeWords'],
        weight: 5
      }
    ];

    // Sort templates by weight (highest first)
    this.templates.sort((a, b) => b.weight - a.weight);
  }

  private initializeAssociations(): void {
    // Create semantic associations for word drift
    this.associations.set('electricity', ['lightning', 'power', 'energy', 'circuit', 'spark']);
    this.associations.set('dream', ['sleep', 'vision', 'fantasy', 'nightmare', 'imagination']);
    this.associations.set('butterfly', ['wings', 'transformation', 'flower', 'flight', 'metamorphosis']);
    this.associations.set('music', ['sound', 'rhythm', 'melody', 'harmony', 'symphony']);
    this.associations.set('mathematics', ['numbers', 'equations', 'infinity', 'calculation', 'logic']);
    this.associations.set('poetry', ['words', 'rhythm', 'metaphor', 'verse', 'language']);
    this.associations.set('time', ['clock', 'eternity', 'moment', 'forever', 'history']);
    this.associations.set('light', ['darkness', 'shadow', 'illumination', 'brightness', 'sun']);
    this.associations.set('water', ['ocean', 'river', 'rain', 'ice', 'flow']);
    this.associations.set('fire', ['flame', 'heat', 'burn', 'ash', 'phoenix']);
  }

  private getRandomFromCategory(categoryName: keyof WordCategory): string {
    const category = this.wordCategories[categoryName];
    return category[Math.floor(Math.random() * category.length)] || 'mystery';
  }

  private generateFromTemplate(template: RacterTemplate): string {
    let result = template.pattern;
    
    // Replace placeholders with random words from categories
    const placeholderRegex = /\{(\w+)\}/g;
    result = result.replace(placeholderRegex, (match, categoryName) => {
      if (categoryName in this.wordCategories) {
        const word = this.getRandomFromCategory(categoryName as keyof WordCategory);
        // Track concepts for potential associations
        this.lastConcepts.push(word);
        return word;
      }
      return match;
    });

    // Limit concept tracking to last 5 words
    this.lastConcepts = this.lastConcepts.slice(-5);
    
    return result;
  }

  private generateAssociativeFragment(): string {
    if (this.lastConcepts.length === 0) {
      const template = this.templates[0];
      if (!template) return 'silence speaks volumes';
      return this.generateFromTemplate(template);
    }

    // Try to build associations from recent concepts
    const baseConcept = this.lastConcepts[this.lastConcepts.length - 1];
    if (!baseConcept) {
      // Fallback to template generation
      const template = this.templates[Math.floor(Math.random() * this.templates.length)];
      if (!template) return 'chaos creates meaning';
      return this.generateFromTemplate(template);
    }
    const associations = this.associations.get(baseConcept) || [];
    
    if (associations.length > 0) {
      const associatedWord = associations[Math.floor(Math.random() * associations.length)];
      const emotion = this.getRandomFromCategory('emotions');
      const adjective = this.getRandomFromCategory('adjectives');
      
      const fragments = [
        `${associatedWord} whispers to ${adjective} ${emotion}.`,
        `The ${adjective} ${associatedWord} remembers ${baseConcept}.`,
        `In ${associatedWord}, ${baseConcept} discovers ${emotion}.`,
        `${associatedWord} and ${baseConcept} dance through ${adjective} infinity.`
      ];
      
      return fragments[Math.floor(Math.random() * fragments.length)] || 'silence';
    }

    // Fallback to template generation
    const template = this.templates[Math.floor(Math.random() * this.templates.length)];
    if (!template) return 'chaos creates meaning';
    return this.generateFromTemplate(template);
  }

  async *process(input: string): AsyncGenerator<string> {
    // RACTER largely ignores input, generating based on internal patterns
    // But we can use input words to seed associations
    if (input.trim()) {
      const words = input.toLowerCase().match(/\b\w+\b/g) || [];
      for (const word of words) {
        if (this.associations.has(word)) {
          this.lastConcepts.push(word);
        }
      }
    }

    // Generate multiple fragments for stream-of-consciousness effect
    const fragmentCount = Math.floor(Math.random() * 3) + 1; // 1-3 fragments
    const fragments: string[] = [];
    
    for (let i = 0; i < fragmentCount; i++) {
      // If we have concepts, prefer associative generation
      if (this.lastConcepts.length > 0 && (i === 0 || Math.random() < 0.7)) {
        // Use associative generation
        fragments.push(this.generateAssociativeFragment());
      } else {
        // Use template generation
        const template = this.templates[Math.floor(Math.random() * this.templates.length)];
        if (template) {
          fragments.push(this.generateFromTemplate(template));
        } else {
          fragments.push('silence');
        }
      }
    }
    
    // Join fragments with appropriate spacing
    const response = fragments.join(' ');
    yield response;
  }
}