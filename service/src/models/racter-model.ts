import { Model } from './model.js';
import { Choice } from '../utils/choice.js';
import { ChoiceRegistry } from '../utils/choice-registry.js';

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
  id: string;
  pattern: string;
  categories: string[];
  weight: number;
}

export class RacterModel implements Model {
  readonly choices = new ChoiceRegistry();
  
  readonly templates = this.choices.create('templates', [
    // Classic RACTER-style comparative statements
    {
      id: 'comparative-materials',
      pattern: 'More than {materials}, more than {materials}, more than {materials} I need {nouns}.',
      categories: ['materials', 'nouns'],
      weight: 10
    },
    {
      id: 'comparative-needs',
      pattern: 'I need it more than I need {nouns} or {nouns} or {nouns}.',
      categories: ['nouns'],
      weight: 8
    },

    // Surreal imagery and metaphors
    {
      id: 'surreal-dual',
      pattern: 'The {nouns} {verbs} of {adjectives} {abstracts} while the {nouns} {verbs} at {colors} {abstracts}.',
      categories: ['nouns', 'verbs', 'adjectives', 'abstracts', 'colors'],
      weight: 9
    },
    {
      id: 'temporal-existence',
      pattern: '{adjectives} {nouns} are {verbs} in the {nouns} of {temporals} {emotions}.',
      categories: ['adjectives', 'nouns', 'verbs', 'temporals', 'emotions'],
      weight: 8
    },

    // Stream-of-consciousness fragments  
    {
      id: 'inner-reflection',
      pattern: '{nouns} is the {adjectives} {nouns} that {verbs} in my {abstracts}.',
      categories: ['nouns', 'adjectives', 'verbs', 'abstracts'],
      weight: 7
    },
    {
      id: 'philosophical-question',
      pattern: 'Why do {adjectives} {nouns} {verbs} when {colors} {abstracts} {verbs}?',
      categories: ['adjectives', 'nouns', 'verbs', 'colors', 'abstracts'],
      weight: 6
    },

    // Poetic repetition
    {
      id: 'triple-repetition',
      pattern: '{nouns}, {nouns}, {nouns}. All {verbs} like {adjectives} {emotions}.',
      categories: ['nouns', 'verbs', 'adjectives', 'emotions'],
      weight: 7
    },
    {
      id: 'temporal-location',
      pattern: 'In the {nouns} of {nouns}, {adjectives} {nouns} {verbs} {temporals}.',
      categories: ['nouns', 'adjectives', 'verbs', 'temporals'],
      weight: 6
    },

    // Abstract relationships
    {
      id: 'between-lies',
      pattern: 'Between {nouns} and {nouns} lies {adjectives} {abstracts}.',
      categories: ['nouns', 'adjectives', 'abstracts'],
      weight: 6
    },
    {
      id: 'teacher-student',
      pattern: 'The {adjectives} {nouns} teaches {abstracts} to {colors} {emotions}.',
      categories: ['adjectives', 'nouns', 'abstracts', 'colors', 'emotions'],
      weight: 7
    },

    // Existential statements
    {
      id: 'identity-declaration',
      pattern: 'I am {adjectives} {nouns} {verbs} in {adjectives} {abstracts}.',
      categories: ['adjectives', 'nouns', 'verbs', 'abstracts'],
      weight: 5
    },
    {
      id: 'universal-except',
      pattern: 'Everything {verbs} except {adjectives} {nouns} and {colors} {emotions}.',
      categories: ['verbs', 'adjectives', 'nouns', 'colors', 'emotions'],
      weight: 5
    },

    // Dadaist combinations
    {
      id: 'mathematical-equation',
      pattern: '{adjectives} {nouns} plus {adjectives} {nouns} equals {colors} {abstracts}.',
      categories: ['adjectives', 'nouns', 'colors', 'abstracts'],
      weight: 6
    },
    {
      id: 'conditional-logic',
      pattern: 'If {nouns} {verbs}, then {adjectives} {abstracts} must {verbs} {temporals}.',
      categories: ['nouns', 'verbs', 'adjectives', 'abstracts', 'temporals'],
      weight: 5
    }
  ].sort((a, b) => b.weight - a.weight));
  
  // Word categories as Choice instances for deterministic testing
  readonly nouns = this.choices.create('nouns', [
    'electricity', 'butterfly', 'library', 'symphony', 'mathematics', 'poetry', 'machine',
    'dream', 'shadow', 'mirror', 'crystal', 'thunder', 'whisper', 'memory', 'silence',
    'ocean', 'mountain', 'fire', 'ice', 'steel', 'glass', 'paper', 'ink', 'light',
    'darkness', 'wind', 'rain', 'snow', 'desert', 'forest', 'river', 'bridge', 'tower',
    'garden', 'flower', 'tree', 'bird', 'cat', 'horse', 'lion', 'elephant', 'whale',
    'clock', 'door', 'window', 'book', 'letter', 'photograph', 'painting', 'sculpture'
  ]);
  
  readonly verbs = this.choices.create('verbs', [
    'dreams', 'whispers', 'dances', 'sings', 'cries', 'laughs', 'screams', 'melts',
    'freezes', 'burns', 'flows', 'crashes', 'explodes', 'dissolves', 'transforms',
    'creates', 'destroys', 'builds', 'breaks', 'flies', 'crawls', 'runs', 'walks',
    'thinks', 'remembers', 'forgets', 'loves', 'hates', 'fears', 'hopes', 'desires',
    'needs', 'wants', 'seeks', 'finds', 'loses', 'discovers', 'reveals', 'hides'
  ]);
  
  readonly adjectives = this.choices.create('adjectives', [
    'purple', 'golden', 'silver', 'crimson', 'emerald', 'azure', 'violet', 'scarlet',
    'electric', 'magnetic', 'liquid', 'crystalline', 'metallic', 'transparent', 'opaque',
    'infinite', 'eternal', 'temporal', 'ancient', 'modern', 'forgotten', 'remembered',
    'broken', 'perfect', 'twisted', 'smooth', 'rough', 'soft', 'hard', 'delicate',
    'brutal', 'gentle', 'fierce', 'calm', 'chaotic', 'ordered', 'strange', 'familiar'
  ]);
  
  readonly emotions = this.choices.create('emotions', [
    'melancholy', 'ecstasy', 'longing', 'despair', 'wonder', 'terror', 'bliss',
    'anguish', 'serenity', 'rage', 'passion', 'indifference', 'nostalgia', 'euphoria'
  ]);
  
  readonly abstracts = this.choices.create('abstracts', [
    'time', 'space', 'existence', 'nothingness', 'infinity', 'eternity', 'moment',
    'thought', 'consciousness', 'reality', 'illusion', 'truth', 'lie', 'beauty',
    'chaos', 'order', 'freedom', 'imprisonment', 'birth', 'death', 'love', 'hate'
  ]);
  
  readonly materials = this.choices.create('materials', [
    'iron', 'steel', 'gold', 'silver', 'copper', 'glass', 'crystal', 'marble',
    'wood', 'stone', 'clay', 'sand', 'water', 'oil', 'honey', 'silk', 'velvet'
  ]);
  
  readonly colors = this.choices.create('colors', [
    'red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black',
    'white', 'gray', 'crimson', 'azure', 'emerald', 'golden', 'silver', 'violet'
  ]);
  
  readonly temporals = this.choices.create('temporals', [
    'yesterday', 'today', 'tomorrow', 'forever', 'never', 'always', 'sometimes',
    'now', 'then', 'before', 'after', 'during', 'while', 'when', 'until', 'since'
  ]);

  // Control choices for test determinism
  readonly fragmentCountChoice = this.choices.create('fragmentCountChoice', [1, 2, 3]);
  readonly associativeChoice = this.choices.create('associativeChoice', [true, false, false]);
  readonly fragmentTypeChoice = this.choices.create('fragmentTypeChoice', [
    'whispers', 'remembers', 'discovers', 'dance'
  ]);
  // Association choices - each concept has its own controllable choice  
  private readonly associationChoices = new Map<string, Choice<string>>([
    ['electricity', this.choices.create('associations-electricity', ['lightning', 'power', 'energy', 'circuit', 'spark'])],
    ['dream', this.choices.create('associations-dream', ['sleep', 'vision', 'fantasy', 'nightmare', 'imagination'])],
    ['butterfly', this.choices.create('associations-butterfly', ['wings', 'transformation', 'flower', 'flight', 'metamorphosis'])],
    ['music', this.choices.create('associations-music', ['sound', 'rhythm', 'melody', 'harmony', 'symphony'])],
    ['mathematics', this.choices.create('associations-mathematics', ['numbers', 'equations', 'infinity', 'calculation', 'logic'])],
    ['poetry', this.choices.create('associations-poetry', ['words', 'rhythm', 'metaphor', 'verse', 'language'])],
    ['time', this.choices.create('associations-time', ['clock', 'eternity', 'moment', 'forever', 'history'])],
    ['light', this.choices.create('associations-light', ['darkness', 'shadow', 'illumination', 'brightness', 'sun'])],
    ['water', this.choices.create('associations-water', ['ocean', 'river', 'rain', 'ice', 'flow'])],
    ['fire', this.choices.create('associations-fire', ['flame', 'heat', 'burn', 'ash', 'phoenix'])]
  ]);
  
  private lastConcepts: string[] = [];

  /** Get association choice for a concept (for test queuing) */
  getAssociationChoice(concept: string): Choice<string> | undefined {
    return this.associationChoices.get(concept);
  }

  private getChoice(categoryName: string): Choice<string> {
    switch (categoryName) {
      case 'nouns': return this.nouns;
      case 'verbs': return this.verbs;
      case 'adjectives': return this.adjectives;
      case 'emotions': return this.emotions;
      case 'abstracts': return this.abstracts;
      case 'materials': return this.materials;
      case 'colors': return this.colors;
      case 'temporals': return this.temporals;
      default: throw new Error(`Unknown category: ${categoryName}`);
    }
  }

  private getAssociativeWord(baseConcept: string): string {
    const associationChoice = this.associationChoices.get(baseConcept);
    if (!associationChoice) {
      return baseConcept; // Fallback to the concept itself if no associations
    }
    
    // Use the specific association choice for this concept
    return associationChoice.pick();
  }

  private generateFromTemplate(template: RacterTemplate): string {
    let result = template.pattern;
    
    // Replace placeholders with words from Choice instances
    const placeholderRegex = /\{(\w+)\}/g;
    result = result.replace(placeholderRegex, (match, categoryName) => {
      try {
        const choice = this.getChoice(categoryName);
        const word = choice.pick();
        // Track concepts for potential associations
        this.lastConcepts.push(word);
        return word;
      } catch {
        return match; // Unknown category, leave placeholder unchanged
      }
    });

    // Limit concept tracking to last 5 words
    this.lastConcepts = this.lastConcepts.slice(-5);
    
    return result;
  }

  private generateAssociativeFragment(): string {
    if (this.lastConcepts.length === 0) {
      const template = this.templates.pick();
      return this.generateFromTemplate(template);
    }

    // Try to build associations from recent concepts
    const baseConcept = this.lastConcepts[this.lastConcepts.length - 1];
    if (!baseConcept) {
      const template = this.templates.pick();
      return this.generateFromTemplate(template);
    }
    const associationChoice = this.associationChoices.get(baseConcept);
    
    if (associationChoice) {
      const associatedWord = this.getAssociativeWord(baseConcept);
      const emotion = this.emotions.pick();
      const adjective = this.adjectives.pick();
      const fragmentType = this.fragmentTypeChoice.pick();
      
      const fragmentTemplates = {
        whispers: `${associatedWord} whispers to ${adjective} ${emotion}.`,
        remembers: `The ${adjective} ${associatedWord} remembers ${baseConcept}.`,
        discovers: `In ${associatedWord}, ${baseConcept} discovers ${emotion}.`,
        dance: `${associatedWord} and ${baseConcept} dance through ${adjective} infinity.`
      };
      
      return fragmentTemplates[fragmentType as keyof typeof fragmentTemplates] || 'silence';
    }

    // Fallback to template generation
    const template = this.templates.pick();
    return this.generateFromTemplate(template);
  }

  async *process(input: string): AsyncGenerator<string> {
    // RACTER largely ignores input, generating based on internal patterns
    // But we can use input words to seed associations
    if (input.trim()) {
      const words = input.toLowerCase().match(/\b\w+\b/g) || [];
      for (const word of words) {
        if (this.associationChoices.has(word)) {
          this.lastConcepts.push(word);
        }
      }
    }

    // Generate multiple fragments for stream-of-consciousness effect
    const fragmentCount = this.fragmentCountChoice.pick();
    const fragments: string[] = [];
    
    for (let i = 0; i < fragmentCount; i++) {
      // If we have concepts, prefer associative generation
      const useAssociative = this.lastConcepts.length > 0 && (i === 0 || this.associativeChoice.pick());
      if (useAssociative) {
        fragments.push(this.generateAssociativeFragment());
      } else {
        const template = this.templates.pick();
        fragments.push(this.generateFromTemplate(template));
      }
    }
    
    // Join fragments with appropriate spacing
    const response = fragments.join(' ');
    yield response;
  }
}
