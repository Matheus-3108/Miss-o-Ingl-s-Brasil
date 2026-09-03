/* ===================================================================
   MISSÃO INGLÊS BRASIL — DATA LAYER
   Todo o conteúdo pedagógico vive aqui, separado da lógica e da UI.
   Para adicionar uma fase, mundo, pergunta ou conquista nova,
   edite apenas este arquivo (veja README.md).
   =================================================================== */

(function () {
  "use strict";
  /* Isolado num escopo próprio (IIFE) para não colidir com outros
   arquivos carregados na mesma página: sem isso, 'const CONFIG',
   'const WORLDS' etc. aqui e em engine.js/app.js compartilhariam o
   mesmo escopo de topo do documento e um SyntaxError de
   'Identifier already declared' impediria os outros scripts de rodar. */


  /* -------------------- CONFIGURAÇÃO CENTRAL -------------------- */
  const CONFIG = {
    xp: {
      correctAnswer: 5,
      levelComplete: 20,
      finalChallenge: 15,
      boss: 50,
    },
    coins: {
      levelComplete: 10,
      bossComplete: 30,
      dailyQuest: 10,
    },
    stars: {
      // percentual mínimo de acerto para cada quantidade de estrelas
      three: 0.9,
      two: 0.7,
      one: 0, // completar já garante 1 estrela
    },
    levelsPerUserLevel: 3, // a cada X fases concluídas, sobe 1 "nível de jogador" (aprox., XP-based na prática)
  };

  /* -------------------- VOCABULÁRIO -------------------- */
  const VOCABULARY = [
    { word: "hello", translation: "olá", pronunciation: "/həˈloʊ/", example: "Hello! How are you?", category: "greetings", difficulty: "easy" },
    { word: "hi", translation: "oi", pronunciation: "/haɪ/", example: "Hi there!", category: "greetings", difficulty: "easy" },
    { word: "goodbye", translation: "tchau", pronunciation: "/ɡʊdˈbaɪ/", example: "Goodbye, see you tomorrow.", category: "greetings", difficulty: "easy" },
    { word: "bye", translation: "tchau", pronunciation: "/baɪ/", example: "Bye! Have a nice day.", category: "greetings", difficulty: "easy" },
    { word: "name", translation: "nome", pronunciation: "/neɪm/", example: "My name is Ana.", category: "greetings", difficulty: "easy" },
    { word: "nice to meet you", translation: "prazer em conhecer você", pronunciation: "/naɪs tuː miːt juː/", example: "Nice to meet you!", category: "greetings", difficulty: "easy" },
    { word: "where are you from", translation: "de onde você é", pronunciation: "", example: "Where are you from?", category: "greetings", difficulty: "easy" },
    { word: "student", translation: "estudante", pronunciation: "/ˈstuːdənt/", example: "She is a student.", category: "people", difficulty: "easy" },
    { word: "teacher", translation: "professor(a)", pronunciation: "/ˈtiːtʃər/", example: "The teacher is kind.", category: "people", difficulty: "easy" },
    { word: "mother", translation: "mãe", pronunciation: "/ˈmʌðər/", example: "My mother works at a school.", category: "people", difficulty: "easy" },
    { word: "father", translation: "pai", pronunciation: "/ˈfɑːðər/", example: "My father likes soccer.", category: "people", difficulty: "easy" },
    { word: "friend", translation: "amigo(a)", pronunciation: "/frend/", example: "She is my friend.", category: "people", difficulty: "easy" },
    { word: "book", translation: "livro", pronunciation: "/bʊk/", example: "I read a book.", category: "objects", difficulty: "easy" },
    { word: "chair", translation: "cadeira", pronunciation: "/tʃɛr/", example: "The chair is blue.", category: "objects", difficulty: "easy" },
    { word: "phone", translation: "telefone", pronunciation: "/foʊn/", example: "Where is my phone?", category: "objects", difficulty: "easy" },
    { word: "blue", translation: "azul", pronunciation: "/bluː/", example: "The sky is blue.", category: "colors", difficulty: "easy" },
    { word: "red", translation: "vermelho", pronunciation: "/rɛd/", example: "I like the red car.", category: "colors", difficulty: "easy" },
    { word: "green", translation: "verde", pronunciation: "/ɡriːn/", example: "The grass is green.", category: "colors", difficulty: "easy" },
    { word: "apple", translation: "maçã", pronunciation: "/ˈæpəl/", example: "She eats an apple every morning.", category: "food", difficulty: "easy" },
    { word: "dog", translation: "cachorro", pronunciation: "/dɔːɡ/", example: "The dog is happy.", category: "animals", difficulty: "easy" },
    { word: "cat", translation: "gato", pronunciation: "/kæt/", example: "The cat is sleeping.", category: "animals", difficulty: "easy" },
    { word: "happy", translation: "feliz", pronunciation: "/ˈhæpi/", example: "I am happy today.", category: "feelings", difficulty: "easy" },
  ].reduce((acc, v) => { acc[v.word] = { ...v, mastery: 0, lastReview: null, nextReview: null, errorCount: 0 }; return acc; }, {});

  /* -------------------- EXERCÍCIOS POR FASE -------------------- */
  /* Tipos suportados no protótipo: multiple_choice, translation,
     fill_blank, image_choice, sentence_building, reading */

  const world1Level1Exercises = [
    { id: "w1l1-e1", type: "multiple_choice", question: "What does “Hello” mean?", options: ["Tchau", "Olá", "Obrigado", "Desculpa"], correctAnswer: "Olá", explanation: "“Hello” significa “Olá”, usado para cumprimentar alguém.", difficulty: "easy", skill: "vocabulary", vocabulary: ["hello"], xp: 5 },
    { id: "w1l1-e2", type: "translation", question: "Traduza: “Oi”", options: ["Goodbye", "Hi", "Please", "Sorry"], correctAnswer: "Hi", explanation: "“Hi” é uma forma informal de dizer “Oi”.", difficulty: "easy", skill: "vocabulary", vocabulary: ["hi"], xp: 5 },
    { id: "w1l1-e3", type: "multiple_choice", question: "Which word means “Tchau”?", options: ["Hello", "Bye", "Name", "Friend"], correctAnswer: "Bye", explanation: "“Bye” é uma forma curta e comum de se despedir.", difficulty: "easy", skill: "vocabulary", vocabulary: ["bye"], xp: 5 },
    { id: "w1l1-e4", type: "fill_blank", question: "Complete: “___! How are you?”", options: ["Hello", "Book", "Chair", "Green"], correctAnswer: "Hello", explanation: "Usamos “Hello” para começar uma conversa educadamente.", difficulty: "easy", skill: "grammar", vocabulary: ["hello"], xp: 5 },
    { id: "w1l1-e5", type: "multiple_choice", question: "“Goodbye” is used when...", options: ["you arrive", "you leave", "you eat", "you sleep"], correctAnswer: "you leave", explanation: "“Goodbye” é usado ao se despedir, quando alguém está saindo.", difficulty: "easy", skill: "vocabulary", vocabulary: ["goodbye"], xp: 5 },
  ];

  const world1Level2Exercises = [
    { id: "w1l2-e1", type: "multiple_choice", question: "Choose the correct sentence:", options: ["My name is Lucas.", "My name are Lucas.", "My name be Lucas.", "My name am Lucas."], correctAnswer: "My name is Lucas.", explanation: "Usamos “is” com “name” (terceira pessoa do singular).", difficulty: "easy", skill: "grammar", vocabulary: ["name"], xp: 5 },
    { id: "w1l2-e2", type: "fill_blank", question: "Complete: “I ___ Ana.”", options: ["am", "is", "are", "be"], correctAnswer: "am", explanation: "Com “I”, usamos “am”: I am.", difficulty: "easy", skill: "grammar", vocabulary: [], xp: 5 },
    { id: "w1l2-e3", type: "translation", question: "Traduza: “Prazer em conhecer você”", options: ["Nice to meet you", "See you later", "Good night", "Thank you"], correctAnswer: "Nice to meet you", explanation: "“Nice to meet you” é usado ao conhecer alguém pela primeira vez.", difficulty: "easy", skill: "vocabulary", vocabulary: ["nice to meet you"], xp: 5 },
    { id: "w1l2-e4", type: "multiple_choice", question: "Which sentence introduces yourself?", options: ["I'm Marcos.", "He is Marcos.", "They are Marcos.", "You are Marcos."], correctAnswer: "I'm Marcos.", explanation: "“I'm” é a contração de “I am”, usada para se apresentar.", difficulty: "easy", skill: "grammar", vocabulary: [], xp: 5 },
  ];

  const world1Level3Exercises = [
    { id: "w1l3-e1", type: "multiple_choice", question: "How do you ask someone's name?", options: ["What is your name?", "Where is your name?", "How is your name?", "Who your name?"], correctAnswer: "What is your name?", explanation: "“What is your name?” é a forma correta de perguntar o nome de alguém.", difficulty: "easy", skill: "grammar", vocabulary: [], xp: 5 },
    { id: "w1l3-e2", type: "fill_blank", question: "Complete: “___ are you from?”", options: ["Where", "What", "Who", "When"], correctAnswer: "Where", explanation: "“Where are you from?” pergunta o local de origem.", difficulty: "easy", skill: "grammar", vocabulary: ["where are you from"], xp: 5 },
    { id: "w1l3-e3", type: "translation", question: "Traduza: “Eu sou do Brasil.”", options: ["I am from Brazil.", "I is from Brazil.", "I from Brazil am.", "I are Brazil."], correctAnswer: "I am from Brazil.", explanation: "“I am from + país” indica de onde você é.", difficulty: "easy", skill: "grammar", vocabulary: [], xp: 5 },
    { id: "w1l3-e4", type: "reading", passage: "Hi! My name is Sofia. I am from Brazil. Nice to meet you!", question: "Where is Sofia from?", options: ["Brazil", "Portugal", "Spain", "France"], correctAnswer: "Brazil", explanation: "O texto diz “I am from Brazil.”", difficulty: "easy", skill: "reading", vocabulary: [], xp: 5 },
  ];

  const world1Level4Exercises = [
    { id: "w1l4-e1", type: "image_choice", emoji: "🟦", question: "What color is this?", options: ["Blue", "Red", "Green", "Yellow"], correctAnswer: "Blue", explanation: "🟦 representa a cor azul, “Blue”.", difficulty: "easy", skill: "vocabulary", vocabulary: ["blue"], xp: 5 },
    { id: "w1l4-e2", type: "image_choice", emoji: "🟥", question: "What color is this?", options: ["Green", "Blue", "Red", "Purple"], correctAnswer: "Red", explanation: "🟥 representa a cor vermelha, “Red”.", difficulty: "easy", skill: "vocabulary", vocabulary: ["red"], xp: 5 },
    { id: "w1l4-e3", type: "multiple_choice", question: "What is “livro” in English?", options: ["Chair", "Book", "Phone", "Table"], correctAnswer: "Book", explanation: "“Book” significa “livro”.", difficulty: "easy", skill: "vocabulary", vocabulary: ["book"], xp: 5 },
    { id: "w1l4-e4", type: "translation", question: "Traduza: “cadeira”", options: ["Chair", "Book", "Phone", "Green"], correctAnswer: "Chair", explanation: "“Chair” significa “cadeira”.", difficulty: "easy", skill: "vocabulary", vocabulary: ["chair"], xp: 5 },
  ];

  const world1Level5Exercises = [
    { id: "w1l5-e1", type: "multiple_choice", question: "What is “professor(a)” in English?", options: ["Student", "Teacher", "Friend", "Mother"], correctAnswer: "Teacher", explanation: "“Teacher” significa “professor(a)”.", difficulty: "easy", skill: "vocabulary", vocabulary: ["teacher"], xp: 5 },
    { id: "w1l5-e2", type: "translation", question: "Traduza: “amigo”", options: ["Friend", "Father", "Student", "Teacher"], correctAnswer: "Friend", explanation: "“Friend” significa “amigo(a)”.", difficulty: "easy", skill: "vocabulary", vocabulary: ["friend"], xp: 5 },
    { id: "w1l5-e3", type: "image_choice", emoji: "🐱", question: "What animal is this?", options: ["Dog", "Cat", "Horse", "Bird"], correctAnswer: "Cat", explanation: "🐱 é um gato, “Cat” em inglês.", difficulty: "easy", skill: "vocabulary", vocabulary: ["cat"], xp: 5 },
    { id: "w1l5-e4", type: "multiple_choice", question: "“Mother” means...", options: ["Pai", "Mãe", "Irmã", "Avó"], correctAnswer: "Mãe", explanation: "“Mother” significa “mãe”.", difficulty: "easy", skill: "vocabulary", vocabulary: ["mother"], xp: 5 },
  ];

  const world1Level6Exercises = [
    { id: "w1l6-e1", type: "fill_blank", question: "Complete: “She ___ happy.”", options: ["is", "am", "are", "be"], correctAnswer: "is", explanation: "Com “she”, usamos “is”.", difficulty: "easy", skill: "grammar", vocabulary: ["happy"], xp: 5 },
    { id: "w1l6-e2", type: "sentence_building", question: "Organize a frase:", words: ["I", "am", "a", "student"], correctAnswer: "I am a student", explanation: "A ordem correta é: sujeito + verbo + artigo + substantivo.", difficulty: "easy", skill: "grammar", vocabulary: ["student"], xp: 5 },
    { id: "w1l6-e3", type: "sentence_building", question: "Organize a frase:", words: ["They", "are", "my", "friends"], correctAnswer: "They are my friends", explanation: "Com “they”, usamos “are”.", difficulty: "easy", skill: "grammar", vocabulary: ["friend"], xp: 5 },
    { id: "w1l6-e4", type: "multiple_choice", question: "Choose the correct sentence:", options: ["He is happy.", "He are happy.", "He am happy.", "He be happy."], correctAnswer: "He is happy.", explanation: "Com “he”, usamos “is”.", difficulty: "easy", skill: "grammar", vocabulary: ["happy"], xp: 5 },
  ];

  /* -------------------- BOSS: FIRST CONVERSATION -------------------- */
  const BOSS_DIALOGUE = [
    { speaker: "npc", line: "Hello!" },
    { speaker: "user", options: ["Hi!", "Goodbye!", "Book."], correctAnswer: "Hi!", explanation: "Respondemos a um cumprimento com outro cumprimento." },
    { speaker: "npc", line: "What is your name?" },
    { speaker: "user", options: ["My name is Alex.", "I am from Brazil.", "Nice book."], correctAnswer: "My name is Alex.", explanation: "“My name is...” responde à pergunta sobre o nome." },
    { speaker: "npc", line: "Where are you from?" },
    { speaker: "user", options: ["I am from Brazil.", "My name is Alex.", "Goodbye!"], correctAnswer: "I am from Brazil.", explanation: "“I am from...” indica a origem." },
    { speaker: "npc", line: "Nice to meet you!" },
    { speaker: "user", options: ["Nice to meet you too.", "Hello!", "Red apple."], correctAnswer: "Nice to meet you too.", explanation: "Respondemos “nice to meet you” com a mesma expressão." },
  ];

  /* -------------------- ESTRUTURA: WORLD 1 -------------------- */
  const WORLDS = [
    {
      id: "world1",
      title: "FOUNDATIONS",
      order: 1,
      description: "Build your English foundation.",
      requiredLevel: 1,
      locked: false,
      chapters: [
        {
          id: "chapter1",
          worldId: "world1",
          title: "GREETINGS",
          order: 1,
          levels: [
            { id: "world1-level1", worldId: "world1", chapterId: "chapter1", title: "HELLO", objective: "Learn basic greetings.", difficulty: "easy", skills: ["vocabulary", "reading"], vocabulary: ["hello", "hi", "goodbye", "bye"], grammar: [], exercises: world1Level1Exercises, isBoss: false, rewardXP: 20, rewardCoins: 10, unlockRequirements: [] },
            { id: "world1-level2", worldId: "world1", chapterId: "chapter1", title: "MY NAME", objective: "Introduce yourself.", difficulty: "easy", skills: ["vocabulary", "grammar"], vocabulary: ["name", "nice to meet you"], grammar: ["verb-to-be"], exercises: world1Level2Exercises, isBoss: false, rewardXP: 20, rewardCoins: 10, unlockRequirements: ["world1-level1"] },
            { id: "world1-level3", worldId: "world1", chapterId: "chapter1", title: "BASIC QUESTIONS", objective: "Ask and answer basic questions.", difficulty: "easy", skills: ["grammar", "reading"], vocabulary: ["where are you from"], grammar: ["wh-questions"], exercises: world1Level3Exercises, isBoss: false, rewardXP: 20, rewardCoins: 10, unlockRequirements: ["world1-level2"] },
          ],
        },
        {
          id: "chapter2",
          worldId: "world1",
          title: "BASIC ENGLISH",
          order: 2,
          levels: [
            { id: "world1-level4", worldId: "world1", chapterId: "chapter2", title: "COLORS & OBJECTS", objective: "Learn colors and everyday objects.", difficulty: "easy", skills: ["vocabulary"], vocabulary: ["blue", "red", "green", "book", "chair", "phone"], grammar: [], exercises: world1Level4Exercises, isBoss: false, rewardXP: 20, rewardCoins: 10, unlockRequirements: ["world1-level3"] },
            { id: "world1-level5", worldId: "world1", chapterId: "chapter2", title: "PEOPLE", objective: "Learn words for people.", difficulty: "easy", skills: ["vocabulary"], vocabulary: ["mother", "father", "teacher", "student", "friend"], grammar: [], exercises: world1Level5Exercises, isBoss: false, rewardXP: 20, rewardCoins: 10, unlockRequirements: ["world1-level4"] },
            { id: "world1-level6", worldId: "world1", chapterId: "chapter2", title: "BASIC SENTENCES", objective: "Build simple sentences.", difficulty: "easy", skills: ["grammar"], vocabulary: [], grammar: ["verb-to-be"], exercises: world1Level6Exercises, isBoss: false, rewardXP: 20, rewardCoins: 10, unlockRequirements: ["world1-level5"] },
            { id: "world1-boss", worldId: "world1", chapterId: "chapter2", title: "FIRST CONVERSATION", objective: "Have your first conversation in English.", difficulty: "medium", skills: ["grammar", "vocabulary", "speaking"], vocabulary: [], grammar: [], exercises: [], dialogue: BOSS_DIALOGUE, isBoss: true, rewardXP: 50, rewardCoins: 30, unlockRequirements: ["world1-level6"] },
          ],
        },
      ],
    },
    {
      id: "world2",
      title: "EVERYDAY LIFE",
      order: 2,
      description: "Talk about your daily routine.",
      requiredLevel: 1,
      locked: true,
      unlockMessage: "Complete the First Conversation Boss to unlock this world.",
      chapters: [],
    },
  ];

  /* -------------------- TESTE DE NÍVEL (45 QUESTÕES) -------------------- */
  const PLACEMENT_TEST = {
    easy: [
      { q: 'What is the opposite of "hot"?', options: ["Warm", "Cold", "Big", "Fast"], answer: "Cold" },
      { q: "Choose the correct sentence:", options: ["She are happy.", "She am happy.", "She is happy.", "She be happy."], answer: "She is happy." },
      { q: 'What does "apple" mean?', options: ["Banana", "Maçã", "Laranja", "Uva"], answer: "Maçã" },
      { q: 'Complete the sentence: "I ___ a student."', options: ["is", "are", "am", "be"], answer: "am" },
      { q: "Which word represents a color?", options: ["Blue", "Chair", "Run", "School"], answer: "Blue" },
      { q: 'Choose the correct plural: "One book, two ___."', options: ["book", "books", "bookes", "bookies"], answer: "books" },
      { q: 'Read: "Lucas is 15 years old. He likes soccer and plays it every Saturday." What does Lucas like?', options: ["Basketball", "Tennis", "Soccer", "Swimming"], answer: "Soccer" },
      { q: 'What is the meaning of "teacher"?', options: ["Professor(a)", "Médico(a)", "Estudante", "Motorista"], answer: "Professor(a)" },
      { q: 'Complete: "My mother ___ a doctor."', options: ["are", "am", "is", "be"], answer: "is" },
      { q: 'Which word means "cachorro"?', options: ["Cat", "Bird", "Dog", "Fish"], answer: "Dog" },
      { q: "🐱 What animal is this?", options: ["Dog", "Cat", "Horse", "Rabbit"], answer: "Cat", emoji: "🐱" },
      { q: 'Choose the correct option: "I ___ coffee every morning."', options: ["drink", "drinks", "drinking", "drank"], answer: "drink" },
      { q: 'What does "happy" mean?', options: ["Triste", "Cansado", "Feliz", "Bravo"], answer: "Feliz" },
      { q: 'Read: "Anna has a red backpack. She takes it to school every day." What color is Anna\'s backpack?', options: ["Blue", "Green", "Black", "Red"], answer: "Red" },
      { q: 'Complete the sentence: "They ___ my friends."', options: ["is", "am", "are", "be"], answer: "are" },
    ],
    intermediate: [
      { q: "Choose the correct sentence:", options: ["He don't like pizza.", "He doesn't likes pizza.", "He doesn't like pizza.", "He not like pizza."], answer: "He doesn't like pizza." },
      { q: 'What is the closest meaning of "quick"?', options: ["Slow", "Fast", "Heavy", "Quiet"], answer: "Fast" },
      { q: 'Complete: "She ___ TV when I called her."', options: ["watches", "watched", "was watching", "is watching"], answer: "was watching" },
      { q: 'Read: "Maria wanted to buy a new phone, but she didn\'t have enough money. Instead, she decided to save some money every month." Why didn\'t Maria buy the phone?', options: ["She didn't like the phone.", "She lost her phone.", "She didn't have enough money.", "She already had a new phone."], answer: "She didn't have enough money." },
      { q: 'Choose the correct word: "If I have time tomorrow, I ___ you."', options: ["call", "called", "will call", "calling"], answer: "will call" },
      { q: 'What does "borrow" mean?', options: ["To give something permanently", "To take something temporarily from someone", "To buy something expensive", "To lose something"], answer: "To take something temporarily from someone" },
      { q: "Choose the correct sentence:", options: ["I have visited London last year.", "I visited London last year.", "I visit London last year.", "I am visit London last year."], answer: "I visited London last year." },
      { q: 'Read: "Tom studied hard for the test because he wanted to improve his grades. When he received the results, he was very happy." Why did Tom study hard?', options: ["He wanted to improve his grades.", "He didn't like school.", "He wanted to leave school.", "He was bored."], answer: "He wanted to improve his grades." },
      { q: 'Complete: "She has lived here ___ 2020."', options: ["for", "since", "during", "from"], answer: "since" },
      { q: 'What is the meaning of "environment"?', options: ["Ambiente", "Trabalho", "Alimentação", "Transporte"], answer: "Ambiente" },
      { q: 'Choose the best option: "If I were rich, I ___ around the world."', options: ["travel", "traveled", "would travel", "will traveled"], answer: "would travel" },
      { q: "Which sentence best describes the image? (rain)", options: ["It is sunny.", "It is raining.", "It is snowing.", "It is very hot."], answer: "It is raining.", emoji: "🌧️" },
      { q: 'Choose the correct comparative: "My car is ___ than yours."', options: ["fast", "fastest", "faster", "more fast"], answer: "faster" },
      { q: 'Read: "James usually goes to school by bus. However, yesterday he walked because the bus was late." Why did James walk to school?', options: ["He wanted to exercise.", "The bus was late.", "He missed school.", "He didn't have a bus stop."], answer: "The bus was late." },
      { q: "Choose the correct sentence:", options: ["There is many students in the classroom.", "There are much students in the classroom.", "There are many students in the classroom.", "There be many students in the classroom."], answer: "There are many students in the classroom." },
    ],
    hard: [
      { q: 'Choose the correct option: "If I had known about the problem, I ___ you."', options: ["would help", "would have helped", "will help", "helped"], answer: "would have helped" },
      { q: 'What does "although" express?', options: ["Cause", "Contrast", "Time", "Condition"], answer: "Contrast" },
      { q: 'Read: "Despite having studied for several weeks, Daniel felt nervous before the examination. Nevertheless, he managed to remain focused and completed all the questions on time." What can we infer about Daniel?', options: ["He didn't study for the examination.", "He was confident and relaxed.", "He was nervous but managed to stay focused.", "He didn't finish the examination."], answer: "He was nervous but managed to stay focused." },
      { q: "Choose the grammatically correct sentence:", options: ["If she would study more, she would pass.", "If she studied more, she would pass.", "If she studies more, she would passed.", "If she had study more, she passes."], answer: "If she studied more, she would pass." },
      { q: 'What is the closest meaning of "reliable"?', options: ["Someone who can be trusted", "Someone who is always late", "Someone who is very nervous", "Someone who changes opinions frequently"], answer: "Someone who can be trusted" },
      { q: 'Complete the sentence: "By the time we arrived, the movie ___."', options: ["already started", "has already started", "had already started", "was already start"], answer: "had already started" },
      { q: 'Read: "Technology has transformed the way people communicate. Although social media allows individuals to stay connected across long distances, excessive use may negatively affect face-to-face interactions." What is the main idea?', options: ["Social media has no benefits.", "Technology has changed communication, but excessive social media use can have disadvantages.", "People no longer communicate.", "Social media is only useful for businesses."], answer: "Technology has changed communication, but excessive social media use can have disadvantages." },
      { q: 'Choose the correct option: "She suggested ___ earlier to avoid traffic."', options: ["leave", "to leave", "leaving", "left"], answer: "leaving" },
      { q: 'What does the expression "break the ice" mean?', options: ["To literally break something made of ice", "To make a situation more comfortable and less awkward", "To become angry", "To end a friendship"], answer: "To make a situation more comfortable and less awkward" },
      { q: 'Read: "The company decided to postpone the project due to unexpected financial difficulties. As a result, the employees had to adjust their schedules." Why was the project postponed?', options: ["The employees were unavailable.", "The project was too easy.", "The company had unexpected financial difficulties.", "The employees refused to work."], answer: "The company had unexpected financial difficulties." },
      { q: 'Choose the correct passive voice: "People speak English in many countries."', options: ["English speaks in many countries.", "English is spoken in many countries.", "English was speaking in many countries.", "English has speak in many countries."], answer: "English is spoken in many countries." },
      { q: "A factory is releasing smoke near a forest. Which statement best describes a possible environmental concern?", options: ["The factory may contribute to air pollution.", "The forest is causing traffic.", "The factory is producing clean water.", "The trees are increasing industrial production."], answer: "The factory may contribute to air pollution.", emoji: "🏭" },
      { q: 'Choose the word that best completes the sentence: "His explanation was so ___ that everyone understood the problem immediately."', options: ["confusing", "vague", "clear", "complicated"], answer: "clear" },
      { q: 'Read: "Sarah had planned to travel abroad during her vacation. However, after comparing the costs, she realized that the trip would be too expensive. She therefore decided to postpone it until she could save enough money." What did Sarah decide to do?', options: ["Cancel the trip permanently.", "Travel without money.", "Postpone the trip and save money.", "Borrow money from her friends."], answer: "Postpone the trip and save money." },
      { q: 'Choose the best interpretation: "Had I known you were coming, I would have prepared something special." What does the speaker mean?', options: ["They knew the person was coming and prepared something.", "They didn't know the person was coming, so they didn't prepare something special.", "They don't want the person to visit.", "The person came after they prepared something special."], answer: "They didn't know the person was coming, so they didn't prepare something special." },
    ],
  };

  function getAllPlacementQuestions() {
    return [
      ...PLACEMENT_TEST.easy.map((q, i) => ({ ...q, id: `easy-${i + 1}`, band: "easy" })),
      ...PLACEMENT_TEST.intermediate.map((q, i) => ({ ...q, id: `intermediate-${i + 1}`, band: "intermediate" })),
      ...PLACEMENT_TEST.hard.map((q, i) => ({ ...q, id: `hard-${i + 1}`, band: "hard" })),
    ];
  }

  /* -------------------- CONQUISTAS -------------------- */
  const ACHIEVEMENTS = [
    { id: "first-step", title: "FIRST STEP", description: "Complete sua primeira fase.", icon: "🥇", check: (u) => u.completedLevels.length >= 1 },
    { id: "perfect", title: "PERFECT", description: "Complete uma fase sem erros.", icon: "⭐", check: (u) => Object.values(u.stars || {}).some((s) => s >= 3) },
    { id: "explorer", title: "EXPLORER", description: "Complete seu primeiro mundo.", icon: "🧭", check: (u) => u.completedLevels.includes("world1-boss") },
    { id: "on-fire", title: "ON FIRE", description: "Estude vários dias seguidos.", icon: "🔥", check: (u) => u.streak >= 2 },
    { id: "collector", title: "COLLECTOR", description: "Ganhe 100 moedas.", icon: "🪙", check: (u) => u.coins >= 100 },
  ];

  /* -------------------- MISSÕES DIÁRIAS -------------------- */
  function generateDailyQuests() {
    return [
      { id: "daily-lessons", title: "Complete 2 lessons", type: "lessons", target: 2, progress: 0, rewardXP: 20, rewardCoins: 10 },
      { id: "daily-xp", title: "Earn 50 XP", type: "xp", target: 50, progress: 0, rewardXP: 10, rewardCoins: 5 },
      { id: "daily-questions", title: "Practice 5 questions", type: "questions", target: 5, progress: 0, rewardXP: 10, rewardCoins: 5 },
    ];
  }

  /* -------------------- INTERESSES / ONBOARDING -------------------- */
  const INTEREST_OPTIONS = [
    { id: "travel", label: "Viagens", icon: "✈️" },
    { id: "work", label: "Trabalho", icon: "💼" },
    { id: "school", label: "Escola/faculdade", icon: "🎓" },
    { id: "movies", label: "Filmes e séries", icon: "🎬" },
    { id: "music", label: "Música", icon: "🎵" },
    { id: "games", label: "Jogos", icon: "🎮" },
    { id: "conversation", label: "Conversação", icon: "💬" },
    { id: "personal", label: "Desenvolvimento pessoal", icon: "🌱" },
    { id: "other", label: "Outro", icon: "✨" },
  ];

  const TIME_OPTIONS = [
    { id: 5, label: "5 minutos" },
    { id: 10, label: "10 minutos" },
    { id: 15, label: "15 minutos" },
    { id: 20, label: "20 minutos" },
    { id: 30, label: "30 minutos ou mais" },
  ];

  /* -------------------- NÍVEIS DE USUÁRIO (baseado em XP) -------------------- */
  const USER_LEVELS = [
    { level: 1, title: "Beginner", minXP: 0 },
    { level: 2, title: "Beginner+", minXP: 40 },
    { level: 3, title: "Explorer", minXP: 100 },
    { level: 4, title: "Explorer+", minXP: 180 },
    { level: 5, title: "Communicator", minXP: 280 },
  ];

  window.MIB_DATA = {
    CONFIG, VOCABULARY, WORLDS, PLACEMENT_TEST, ACHIEVEMENTS,
    INTEREST_OPTIONS, TIME_OPTIONS, USER_LEVELS,
    getAllPlacementQuestions, generateDailyQuests,
  };

})();
