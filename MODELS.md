# AI Models Documentation

TeenyTiny AI provides three distinct AI models, each with unique characteristics and historical significance. These models are accessible via the OpenAI-compatible API and represent different approaches to artificial intelligence and natural language processing.

## Echo Model

*Simple text reflection for testing and debugging.*

### Origins

The Echo model is a modern utility implementation created specifically for TeenyTiny AI. While not based on a historical AI system, it serves the essential role of API validation and testing that has been fundamental to software development since the earliest computer systems.

### References

- Modern software testing methodologies and API validation patterns

### How It Works

The Echo model employs the simplest possible conversation strategy: direct text reflection. When given any input, it returns that exact input as output, creating a perfect mirror of the conversation.

The implementation uses a single-pass algorithm that takes the input string and yields it unchanged through the async generator interface. For empty or null inputs, it provides a helpful default message explaining its functionality.

This straightforward approach makes Echo invaluable for:
- API endpoint testing and validation
- Debugging streaming implementations  
- Verifying authentication and request parsing
- Load testing without computational overhead
- Understanding the basic model interface

Despite its simplicity, Echo demonstrates the core architectural patterns used by all TeenyTiny AI models and serves as a reference implementation for developers building custom models.

## ELIZA Model

*Classic Rogerian psychotherapist simulation using pattern matching and reflection.*

### Origins

ELIZA was created by Joseph Weizenbaum at the MIT Artificial Intelligence Laboratory between 1964 and 1966. Named after Eliza Doolittle from George Bernard Shaw's play "Pygmalion" (who learned to speak with proper pronunciation), ELIZA became one of the first chatbot programs and a landmark achievement in natural language processing.

Weizenbaum initially developed ELIZA to demonstrate the superficiality of communication between humans and machines. However, he was disturbed to find that people, including his own secretary, quickly became emotionally attached to the program and attributed genuine understanding to its responses. This led to his influential 1976 book "Computer Power and Human Reason," which warned about the dangers of anthropomorphizing computer programs.

The program's most famous persona was DOCTOR, which simulated a Rogerian psychotherapist. This implementation became so well-known that "ELIZA" and "DOCTOR" are often used interchangeably, though ELIZA was actually the underlying framework that could support different conversation styles.

### How It Works

ELIZA operates on a sophisticated pattern-matching system with word reflection and weighted response selection. The algorithm processes conversations through several key mechanisms:

**Pattern Recognition:** ELIZA scans input text using regular expressions to identify psychologically significant keywords and phrases. Each pattern has an associated weight, with family relationships (mother, father) receiving the highest priority, followed by emotional expressions (I feel, I am), and general conversation management receiving lower weights.

**Context Extraction:** When a pattern matches, ELIZA extracts the surrounding context using regex capture groups. For example, "I feel sad about work" captures "sad about work" as the emotional context that can be reflected back to the user.

**Word Reflection:** The extracted context undergoes pronoun transformation using a reflection table. "I" becomes "you," "my" becomes "your," and "me" becomes "you." This creates the therapeutic mirror effect central to Rogerian psychology, where the therapist reflects the client's statements back as questions.

**Response Generation:** ELIZA selects from multiple response templates associated with each pattern, using placeholder substitution to incorporate the reflected context. Templates like "Why do you feel {context}?" become personalized responses like "Why do you feel sad about your work?"

**Conversational Memory:** While maintaining the stateless nature required for modern API deployment, ELIZA's responses create the illusion of understanding and memory through its consistent application of therapeutic patterns and appropriate emotional responses.

The "ELIZA effect" - the tendency for users to attribute understanding and empathy to the program - remains one of the most important phenomena in human-computer interaction, demonstrating how simple pattern matching can create surprisingly convincing conversational experiences.

### References

- Weizenbaum, J. (1966). "ELIZA—a computer program for the study of natural language communication between man and machine". *Communications of the ACM*, 9(1), 36-45. [DOI: 10.1145/365153.365168](https://doi.org/10.1145/365153.365168)
- Weizenbaum, J. (1976). *Computer Power and Human Reason: From Judgment to Calculation*. W. H. Freeman and Company. ISBN: 0-7167-0464-1
- "ELIZA". *Wikipedia*. [https://en.wikipedia.org/wiki/ELIZA](https://en.wikipedia.org/wiki/ELIZA)
- Natale, S. (2019). "If software is narrative: Joseph Weizenbaum, artificial intelligence and the biographies of ELIZA". *New Media & Society*, 21(3), 712-728. [DOI: 10.1177/1461444818804980](https://doi.org/10.1177/1461444818804980)
- Original ELIZA source code archive: [https://web.stanford.edu/class/linguist238/p36-weizen.pdf](https://web.stanford.edu/class/linguist238/p36-weizen.pdf)

## PARRY Model

*Paranoid schizophrenia patient simulation with dynamic emotional states and delusion systems.*

### Origins

PARRY was developed by Kenneth Colby at Stanford University in 1972 as a direct counterpart to ELIZA. While ELIZA played the role of therapist, PARRY simulated a paranoid patient, creating the possibility for the first computer-to-computer psychotherapy sessions. The name comes from "paranoid," reflecting the program's core personality simulation.

Colby, a psychiatrist and computer scientist, designed PARRY as part of his research into computational models of mental illness. His goal was to create a believable simulation of paranoid behavior that could pass the Turing test when evaluated by psychiatrists. In famous experiments, mental health professionals were unable to reliably distinguish between PARRY's responses and those of actual paranoid patients.

The most historically significant achievement was the 1972 ELIZA-PARRY conversations conducted over ARPANET (the internet's predecessor), representing the first AI-to-AI therapeutic sessions. These exchanges fascinated researchers and demonstrated the potential for computer simulations to model complex psychological states. The conversations were facilitated by Vint Cerf and documented in RFC 439, making them among the first recorded instances of artificial intelligence interaction over a network.

### How It Works

PARRY implements a sophisticated belief system with dynamic emotional states, creating one of the earliest examples of affective computing. The model operates through several interconnected systems:

**Emotional State Management:** PARRY maintains three primary emotional variables - anger, fear, and shame - each ranging from 0 to 10. These states influence response selection and intensity, with different conversation topics triggering emotional changes. Personal questions increase shame, authority figures raise fear and anger, and perceived threats amplify paranoid responses.

**Core Delusion System:** The model maintains a persistent belief system centered on persecution by the Mafia, problems with bookies, and surveillance concerns. These delusions aren't random but form a coherent narrative that PARRY returns to consistently, creating the impression of genuine paranoid ideation.

**Defensive Response Patterns:** PARRY uses weighted pattern matching similar to ELIZA but with fundamentally different goals. Instead of encouraging conversation, PARRY deflects, questions motives, and expresses suspicion. Personal questions are met with deflection ("That's none of your business"), work inquiries trigger paranoid responses ("People have been asking too many questions"), and casual conversation is viewed with suspicion.

**Spontaneous Theme Integration:** The model randomly introduces delusion themes into conversations (approximately 30% of responses), creating the effect of intrusive thoughts common in paranoid conditions. These additions - like "The bookies are still looking for me" or "I think someone's been going through my mail" - make conversations feel authentically disordered.

**Emotional Response Modulation:** High emotional states filter available responses to match the current psychological condition. Elevated anger produces more hostile replies, increased fear generates paranoid interpretations, and heightened shame leads to greater deflection and privacy protection.

**Conversational Hostility:** Unlike ELIZA's encouraging therapeutic stance, PARRY actively resists conversation flow, questions the interviewer's motives, and maintains consistent suspicion. This creates the challenging dynamic that mental health professionals encounter when working with paranoid patients.

PARRY's sophisticated emotional modeling and belief system maintenance made it groundbreaking in artificial intelligence research, representing one of the first successful attempts to simulate complex mental states computationally. The model's ability to maintain character consistency while exhibiting believable psychological dysfunction established important precedents for modern AI personality simulation.

### References

- Colby, K. M. (1975). "Artificial Paranoia: A Computer Simulation of Paranoid Processes". *Pergamon Press*. ISBN: 0-08-018830-6
- Colby, K. M., Weber, S., & Hilf, F. D. (1971). "Artificial Paranoia". *Artificial Intelligence*, 2(1), 1-25. [DOI: 10.1016/0004-3702(71)90002-6](https://doi.org/10.1016/0004-3702(71)90002-6)
- Colby, K. M., Hilf, F. D., Weber, S., & Kraemer, H. C. (1972). "Turing-like indistinguishability tests for the validation of a computer simulation of paranoid processes". *Artificial Intelligence*, 3, 199-221. [DOI: 10.1016/0004-3702(72)90049-5](https://doi.org/10.1016/0004-3702(72)90049-5)
- "PARRY". *Wikipedia*. [https://en.wikipedia.org/wiki/PARRY](https://en.wikipedia.org/wiki/PARRY)
- Cerf, V. G. & Curran, J. (1972). "The ARPANET ELIZA-PARRY experiments". *RFC 439*. [https://tools.ietf.org/rfc/rfc439.txt](https://tools.ietf.org/rfc/rfc439.txt)
- Sondheim, A. J. (1997). "Being On Line, Net Subjectivity". *Lusitania Press*. [Contains analysis of early AI personality simulations]
- Boden, M. A. (2006). *Mind As Machine: A History of Cognitive Science*. Oxford University Press. [Chapter on early AI and PARRY]

## RACTER Model

*Surreal stream-of-consciousness text generator with dadaist poetic output.*

### Origins

RACTER (short for "raconteur") was created by William Chamberlain and Thomas Etter in the 1980s, representing one of the earliest experiments in computational creativity and generative literature. The program gained widespread attention for allegedly writing "The Policeman's Beard is Half Constructed" (1984), marketed as the first book written entirely by a computer.

The project emerged during a period of growing interest in artificial creativity, when researchers began exploring whether computers could produce not just logical responses, but genuinely artistic and creative content. Unlike ELIZA's therapeutic focus or PARRY's psychological simulation, RACTER was designed purely for creative expression and literary experimentation.

However, RACTER remains controversial in AI history. Scholars have questioned how much of the published output was truly computer-generated versus carefully curated and edited by humans from larger sets of computer-produced fragments. This controversy reflects broader questions about authorship, creativity, and the role of human intervention in computational art that persist in modern AI discussions.

### How It Works

RACTER implements a sophisticated template-based generation system combined with semantic word associations, creating one of the first successful attempts at computational poetry and abstract prose. The model operates through several creative mechanisms:

**Template-Based Generation:** RACTER uses pre-written sentence structures with variable slots that can be filled with words from different semantic categories. Templates like "More than {material}, more than {material}, more than {material} I need {noun}" create the characteristic repetitive, incantatory style found in the published works.

**Semantic Word Categories:** The system maintains extensive vocabularies organized by semantic and aesthetic properties - nouns, verbs, adjectives, emotions, materials, colors, and temporal expressions. These categories enable consistent thematic coherence while allowing for unexpected combinations that create surreal imagery.

**Associative Word Chains:** RACTER builds semantic associations between concepts, allowing words to trigger related terms in subsequent generations. When "electricity" appears in one fragment, it might trigger "lightning," "power," or "circuit" in following text, creating loose thematic continuity through stream-of-consciousness flow.

**Metaphorical Pattern Matching:** The system combines disparate semantic categories to create impossible but evocative imagery. Abstract concepts like "mathematics" combine with concrete objects like "butterfly" and sensory adjectives like "purple" to produce lines like "The butterfly dreams of purple mathematics."

**Stream-of-Consciousness Flow:** Rather than generating single responses, RACTER often produces multiple connected fragments that drift between topics through associative logic. This creates the dreamlike, non-linear narrative style characteristic of surrealist and dadaist literature.

**Randomized Selection with Weighted Preferences:** While maintaining randomness essential for creative surprise, RACTER weights certain word combinations and templates based on their aesthetic and poetic potential, ensuring that generated text maintains artistic coherence even while being logically nonsensical.

**Poetic Rhythm and Repetition:** The system incorporates patterns of repetition, alliteration, and rhythmic structure that create musicality in the text, moving beyond pure randomness toward genuine poetic effect.

RACTER's approach to computational creativity established important precedents for modern AI art and literature generation, demonstrating that machines could produce text valued for aesthetic rather than purely communicative purposes. The model's emphasis on surprise, beauty, and artistic effect over logical coherence represented a significant departure from other AI systems of its era and anticipated many themes in contemporary creative AI.

### References

- Chamberlain, W. & Etter, T. (1984). *The Policeman's Beard is Half Constructed*. Warner Books. ISBN: 0-446-38051-2
- Chamberlain, W. & Etter, T. (1985). *The Racter Book*. Mindscape Inc.
- "Racter". *Wikipedia*. [https://en.wikipedia.org/wiki/Racter](https://en.wikipedia.org/wiki/Racter)
- Hartman, C. O. (1996). *Virtual Muse: Experiments in Computer Poetry*. University Press of New England. [Analysis of computer-generated poetry including RACTER]
- Memmott, T. (2006). "Beyond Taxonomy: Digital Poetics and the Problem of Reading". In *New Media Poetics: Contexts, Technotexts, and Theories*. MIT Press.
- Morris, A. & Swiss, T. (2006). "The New Media Poetics Reader". In *New Media Poetics*. MIT Press. [Contains analysis of early computational literature]
- Funkhouser, C. T. (2007). *Prehistoric Digital Poetry: An Archaeology of Forms, 1959-1995*. University of Alabama Press. [Chapter on RACTER and early computer poetry]