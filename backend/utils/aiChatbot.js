// Intelligent AI Chatbot with Language Detection (English & Somali)
// Detects user language and responds in the same language

// Language detection function
const detectLanguage = (message) => {
  const msg = message.toLowerCase().trim();
  
  // Somali question words (must check first)
  const somaliQuestionWords = [
    /^(maxaa|maxay|muxuu|muxu|maxaad|maxaan|maxaay|maxaas|maxaase)/i,
    /^(yaa|yaad|yaan|yaay|yaas|yaase)/i,
    /^(goorma|goormay|goormuu|goormaad|goormaan)/i,
    /^(meesha|meeshaa|meeshaay|halka|halkee|halkaas)/i,
    /^(sababta|sababtaa|sababtay|sababtuu)/i,
    /^(sida|sidaan|sidaad|sidaay|sidaas)/i,
    /^(ma|miyuu|miyay|miyaad|miyaan|miyaas|miyaase)/i,
    /^(sidee|sideed|sideen|sideey)/i,
    /^(immisa|immisay|immisuu|immisaad)/i,
  ];
  
  // Check for Somali question words first
  for (const pattern of somaliQuestionWords) {
    if (pattern.test(msg)) {
      return 'somali';
    }
  }
  
  // Somali keywords and patterns
  const somaliPatterns = [
    /^(salam|assalamu|iskawarama|ma nabad|nabad|waryaa|walaal|aabbe|hooyo|adeer|eedo)/i,
    /(maxaa|maxay|muxuu|muxu|waxaan|waxaad|waxay|waxuu|waxa|wax|ma|miyuu|miyay|miyaad|miyaan)/i,
    /(ahay|ahaan|ahayd|ahayeen|ahayd|ahayd|ahayeen|ahayd|ahayd|ahayd)/i,
    /(buug|buugag|buugaag|wax|waxa|waxaan|waxaad|waxay|waxuu)/i,
    /(iibso|iibsado|iibsan|iibsasho|iibsan|iibsasho)/i,
    /(soo|deji|dejin|dejin|dejin|dejin|soo dejiso|soo dejinta)/i,
    /(akownti|akownta|akownta|akownta)/i,
    /(caawin|caawimaad|caawin|caawimaad)/i,
    /(mahadsanid|mahadsan|mahadsanid|mahadsan)/i,
    /(qiimo|qiimaha|immisa|wixii)/i,
    /(bilaash|bilaashka|maali ah)/i,
    /(helitaan|haysataa|ma haysataa)/i,
    /(talin|ku talin|ugu wanaagsan|ugu caansan)/i,
    /(sida loo|sidaan|sidaad)/i,
    /(gal|galitaan|password|hal)/i,
    /(dhib|dhibaato|qalad|khalad)/i,
    /(nabad gelyo|nabad|iskawarama)/i,
    /(qoraa|qorayaal|qoraaga)/i,
    /(lacag|bixin)/i,
  ];
  
  // Check if message contains Somali patterns
  for (const pattern of somaliPatterns) {
    if (pattern.test(msg)) {
      return 'somali';
    }
  }
  
  // Check for common Somali words/phrases
  const somaliCommonWords = [
    /\b(waa|waxaa|waxay|waxuu|waxaad|waxaan)\b/i,
    /\b(ka|ku|ki|ko|kii|kaa|kay|kayga)\b/i,
    /\b(ah|aha|ahay|ahaan|ahayd)\b/i,
    /\b(ku|ka|ki|ko)\b/i,
  ];
  
  // Count Somali words vs English words
  let somaliWordCount = 0;
  for (const pattern of somaliCommonWords) {
    const matches = msg.match(pattern);
    if (matches) {
      somaliWordCount += matches.length;
    }
  }
  
  // If message has significant Somali words, it's likely Somali
  if (somaliWordCount >= 2) {
    return 'somali';
  }
  
  // Check for Somali-specific character patterns (common Somali words)
  const somaliSpecificWords = [
    /\b(buug|buugag|buugaag)\b/i,
    /\b(iibso|iibsado|iibsan)\b/i,
    /\b(soo\s+dejiso|soo\s+dejinta)\b/i,
    /\b(akownti|akownta)\b/i,
    /\b(caawin|caawimaad)\b/i,
    /\b(mahadsanid|mahadsan)\b/i,
    /\b(qiimo|qiimaha)\b/i,
    /\b(bilaash|bilaashka)\b/i,
    /\b(helitaan|haysataa)\b/i,
    /\b(galitaan|gal)\b/i,
    /\b(dhibaato|qalad)\b/i,
  ];
  
  for (const pattern of somaliSpecificWords) {
    if (pattern.test(msg)) {
      return 'somali';
    }
  }
  
  // Default to English
  return 'english';
};

// Get language from conversation history
const getLanguage = (message, conversationHistory) => {
  // Check current message
  const currentLang = detectLanguage(message);
  if (currentLang === 'somali') return 'somali';
  
  // Check recent user messages
  const recentUserMessages = conversationHistory
    .filter(m => m.sender === 'user')
    .slice(-3)
    .map(m => m.message);
  
  for (const msg of recentUserMessages) {
    const lang = detectLanguage(msg);
    if (lang === 'somali') return 'somali';
  }
  
  return 'english';
};

// English responses - now functions that accept websiteName
const englishResponses = (websiteName = "Bookstore") => ({
  greeting: (isFirstTime) => {
    if (isFirstTime) {
      return `Hello! Welcome to ${websiteName}. I'm AI Assistance, and I'm here to help you. I can assist you with:\n\n• Finding and browsing books\n• Book prices and availability\n• How to purchase books\n• Downloading books\n• Account and login help\n• General support\n\nWhat would you like to know?`;
    }
    return "Hello again! How can I assist you further?";
  },
  
  whatAreYou: `I'm AI Assistance, your virtual assistant for ${websiteName}. I can help you with questions about books, purchases, downloads, accounts, and general support. What would you like to know?`,
  
  whatCanYouDo: `I can help you with:\n\n• Finding books by title, author, or genre\n• Information about book prices\n• How to purchase books\n• Downloading purchased books\n• Account creation and login\n• Password recovery\n• General ${websiteName} support\n\nWhat would you like help with?`,
  
  bookPrice: "Our books have various prices depending on the title. You can browse our collection to see individual book prices. Some books are free, while others are priced competitively. Would you like to know about a specific book's price?",
  
  freeBooks: "Yes, we have free books available! You can browse our collection and download free books immediately. Simply look for books marked as free. Would you like help finding free books in a specific genre?",
  
  bookAvailability: "We have a wide collection of books available! You can browse by category, author, or search for specific titles. What type of book are you looking for?",
  
  bookRecommendations: "We have an excellent collection of books across various genres! I'd recommend browsing our catalog to discover books that match your interests. What genres do you enjoy? (Fiction, Non-fiction, Science, History, etc.)",
  
  howToPurchase: "To purchase a book: 1) Browse our collection and find a book you like, 2) Click 'Add to Cart', 3) Go to checkout, 4) Complete secure payment. After purchase, you can immediately download your book!",
  
  howToDownload: "After purchasing a book, you can download it from your account dashboard. Free books can be downloaded immediately without purchase. Simply go to 'My Books' or 'Downloads' section in your account.",
  
  accountHelp: "You can create an account or login to access your purchased books, track downloads, and manage your profile. Need help with login or creating an account?",
  
  support: "I'm here to help! Can you tell me more about the issue you're experiencing? The more details you provide, the better I can assist you. Our support team is also available if needed.",
  
  thankYou: "You're welcome! I'm here whenever you need help.",
  
  goodbye: (websiteName) => `Thank you for visiting ${websiteName}! Have a great day and happy reading! Feel free to come back anytime if you need assistance.`,
  
  default: "I understand. Could you tell me more about what you're looking for? I'm here to help!"
});

// Somali responses
const somaliResponses = {
  greeting: (isFirstTime) => {
    if (isFirstTime) {
      return "Salaam! Ku soo dhawoow dukaanka buugaagta. Waxaan ahay Caawinta AI, waxaana ku caawin karaa:\n\n• Raadinta iyo baarista buugaagta\n• Qiimaha iyo helitaanka buugaagta\n• Sida loo iibsado buugag\n• Soo dejinta buugaagta\n• Caawinta akoonka iyo galitaanka\n• Caawinta guud\n\nMaxaad rabtaa inaad ogaato?";
    }
    return "Salaam mar kale! Sidee ku caawin karaa?";
  },
  
  whatAreYou: "Waxaan ahay Caawinta AI (Artificial Intelligence), oo ah caawiyahaaga virtual ee dukaanka buugaagta. Waxaan ku caawin karaa su'aalo kasta oo ku saabsan:\n\n• Buugaagta iyo macluumaadka ay ku saabsan yihiin\n• Iibsashada buugaagta\n• Soo dejinta buugaagta\n• Akoonka iyo galitaanka\n• Caawinta guud\n\nMaxaad rabtaa inaad ogaato?",
  
  whatCanYouDo: "Waxaan ku caawin karaa waxyaabaha soo socda:\n\n• Raadinta buugaagta magaca, qoraaga, ama nooca\n• Macluumaadka qiimaha buugaagta\n• Sida loo iibsado buugag\n• Soo dejinta buugaagta la iibsaday\n• Abuurista akoonka iyo galitaanka\n• Soo celinta password-ka haddii aad halisay\n• Caawinta guud ee dukaanka buugaagta\n\nMaxaad rabtaa caawin?",
  
  bookPrice: "Buugaagteenu waxay leeyihiin qiimo kala duwan oo ku xidhan cinwaanka. Waxaad ka baaris kartaa kooxdeena si aad u aragto qiimaha buug kasta. Buugag qaar baa bilaash ah, kuwa kalena waxay leeyihiin qiimo tartan leh. Ma rabtaa inaad ogaato qiimaha buug gaar ah?",
  
  freeBooks: "Haa, waxaan haysanaa buugag bilaash ah! Waxaad ka baaris kartaa kooxdeena oo aad si degdeg ah u soo dejisan kartaa buugag bilaash ah. Kaliya raadi buugagta lagu calaamadeeyay inay bilaash yihiin. Ma rabtaa caawin raadinta buugaagta bilaashka ah nooc gaar ah?",
  
  bookAvailability: "Waxaan haysanaa koox weyn oo buugaag ah! Waxaad ka baaris kartaa qaybaha, qoraaga, ama raadi cinwaanada gaarka ah. Nooca buug ee aad raadinayso waa maxay?",
  
  bookRecommendations: "Waxaan haysanaa koox aad u wanaagsan oo buugaag ah oo ku baahsan noocyada kala duwan! Waxaan ku talin lahaa inaad baarisato katalooggeena si aad u hesho buugaagta uu ku xiiseeyo. Noocyada aad jeceshahay waa kuwee? (Sheekooyin, Sheekooyin aan ahayn, Sayniska, Taariikhda, iwm.)",
  
  howToPurchase: "Si aad u iibsato buug: 1) Baariso kooxdeena oo hel buug aad jeceshahay, 2) Guji 'Ku dar Cart-ka', 3) Tag checkout, 4) Dhammeeyso lacag bixinta ammaan ah. Kadib iibsashada, waxaad si degdeg ah u soo dejisan kartaa buuggaaga!",
  
  howToDownload: "Kadib iibsashada buug, waxaad ka soo dejisan kartaa dashboard-ka akoonkaaga. Buugag bilaash ah waxa la soo dejisan karaa si degdeg ah iibsasho la'aan. Kaliya tag qaybta 'Buugaagteyda' ama 'Soo dejinta' akoonkaaga.",
  
  accountHelp: "Waxaad abuuri kartaa akoon ama gal kartaa si aad u hesho buugaagtaada la iibsaday, raadiso soo dejinta, oo maamusho profile-kaaga. Ma u baahan tahay caawin galitaanka ama abuurista akoonka?",
  
  support: "Waxaan halkan u joogaa inaan ku caawiyo! Ma ii sheegi kartaa dheeraadka arrinta aad la kulantay? Macluumaadka aad siisay dheeraadka ah, si fiican ayaan ku caawin karaa. Kooxdeena caawinta sidoo kale way diyaar tahay haddii loo baahdo.",
  
  thankYou: "Mahadsanid! Waxaan halkan u joogaa markii kasta aad u baahan tahay caawin.",
  
  goodbye: "Mahadsanid aad uga soo booqatay dukaanka buugaagta! Maalin wanaagsan oo akhris fiican! Isku soo noqo markii kasta haddii aad u baahan tahay caawin.",
  
  default: "Waan fahmay. Ma ii sheegi kartaa dheeraadka waxa aad raadinayso? Waxaan halkan u joogaa inaan ku caawiyo!"
};

export const getAIResponse = async (userMessage, conversationHistory = [], websiteName = "Bookstore") => {
  // Detect language FIRST using original message (before lowercasing)
  const language = getLanguage(userMessage, conversationHistory);
  const responses = language === 'somali' ? somaliResponses : englishResponses(websiteName);
  
  // Now lowercase for pattern matching
  const message = userMessage.toLowerCase().trim();
  
  // Get last few messages for context
  const recentMessages = conversationHistory.slice(-10);
  const lastAIResponse = recentMessages.filter(m => m.sender === 'ai').pop();
  const isFirstTime = conversationHistory.length === 0;
  
  // "What are you" questions - Check FIRST, before other patterns
  // This must come before greetings and other checks to catch identity questions
  // Enhanced with more Somali variations
  if (message.match(/(what are you|who are you|what is you|what's you|what you are|who you are|what\s+are\s+you|who\s+are\s+you|maxaa tahay|yaa tahay|yaa ahaa|maxaad tahay|yaaad tahay|waxaad tahay|waxaan tahay|waxaad ahayd|waxaan ahay|waxaad ahay|waxaan ahay|maxaa aad tahay|yaa aad tahay|waxaad aad tahay|maxaa aad ahayd|yaa aad ahayd|waxaad aad ahayd|maxaa aad ahay|yaa aad ahay|waxaad aad ahay|maxaa tahay adiga|yaa tahay adiga|waxaad tahay adiga|maxaa aad tahay adiga|yaa aad tahay adiga)/i)) {
    return responses.whatAreYou;
  }
  
  // "What can you do" questions - Check early
  // Enhanced with more Somali variations
  if (message.match(/(what can you|what do you|what can|what you can|what you do|what\s+can\s+you|what\s+do\s+you|maxaad|maxaad sameyn|maxaad samayn|maxaad qaban|waxaad qaban|waxaad sameyn|waxaad qaban kartaa|maxaad qaban kartaa|maxaad sameyn kartaa|waxaad sameyn kartaa|maxaad qaban karto|waxaad qaban karto|maxaad sameyn karto|waxaad sameyn karto|maxaad qaban karaan|waxaad qaban karaan|maxaad sameyn karaan|waxaad sameyn karaan|maxaad qaban kartaa|waxaad qaban kartaa|maxaad qaban kartaan|waxaad qaban kartaan|maxaad qaban kartaan|waxaad qaban kartaan|maxaad qaban kartaan|waxaad qaban kartaan)/i)) {
    return responses.whatCanYouDo;
  }
  
  // Greetings
  if (message.match(/^(hi|hello|hey|salam|assalamu|greetings|good morning|good afternoon|good evening|iskawarama|ma nabad|nabad)/i)) {
    const greetingResponse = responses.greeting(isFirstTime);
    console.log("🤖 AI Greeting with websiteName:", websiteName, "Response:", greetingResponse.substring(0, 50) + "...");
    return greetingResponse;
  }
  
  // Book inquiries
  if (message.match(/(book|books|ebook|ebooks|novel|novels|story|stories|read|reading|author|authors|title|titles|buug|buugag|buugaag|qoraa|qorayaal)/i)) {
    // Price questions
    if (message.match(/(price|cost|how much|expensive|cheap|affordable|pricing|qiimo|qiimaha|immisa|wixii)/i)) {
      return responses.bookPrice;
    }
    
    // Free books
    if (message.match(/(free|free books|no cost|gratis|complimentary|bilaash|bilaashka|maali ah)/i)) {
      return responses.freeBooks;
    }
    
    // Availability
    if (message.match(/(available|have|stock|in stock|do you have|do you sell|helitaan|haysataa|ma haysataa)/i)) {
      return responses.bookAvailability;
    }
    
    // Recommendations
    if (message.match(/(recommend|suggest|suggestion|best|popular|top|favorite|favourite|good|great|talin|ku talin|ugu wanaagsan|ugu caansan)/i)) {
      return responses.bookRecommendations;
    }
    
    // General book questions
    return responses.bookAvailability;
  }
  
  // Purchase/Order questions
  if (message.match(/(buy|purchase|order|payment|pay|checkout|cart|shopping|shop|iibso|iibsado|iibsan|iibsasho|lacag|bixin)/i)) {
    if (message.match(/(how|process|steps|procedure|way|method|sida|sida loo|sidaan|sidaad)/i)) {
      return responses.howToPurchase;
    }
    return responses.howToPurchase;
  }
  
  // Download questions
  if (message.match(/(download|pdf|file|access|get book|receive|obtain|soo|deji|dejin|soo dejiso|soo dejinta)/i)) {
    if (message.match(/(how|where|when|can i|how do i|sida|meesha|goorma)/i)) {
      return responses.howToDownload;
    }
    return responses.howToDownload;
  }
  
  // Account/Login questions
  if (message.match(/(login|sign in|account|profile|register|sign up|create account|new account|password|forgot|gal|galitaan|akownti|akownta|password|hal|hal|hal|hal)/i)) {
    return responses.accountHelp;
  }
  
  // Support/Help
  if (message.match(/(help|support|problem|issue|error|trouble|can't|cannot|unable|need help|stuck|confused|caawin|caawimaad|dhib|dhibaato|qalad|khalad)/i)) {
    return responses.support;
  }
  
  // Thank you
  if (message.match(/(thank|thanks|appreciate|grateful|thank you|mahadsanid|mahadsan|waad mahadsantahay)/i)) {
    return responses.thankYou;
  }
  
  // Goodbye
  if (message.match(/(bye|goodbye|see you|farewell|exit|later|take care|nabad|nabad gelyo|nabad gelyo|iskawarama)/i)) {
    return typeof responses.goodbye === 'function' ? responses.goodbye(websiteName) : responses.goodbye;
  }
  
  // Questions (what, how, when, where, why, who) - Enhanced for both languages
  const isQuestion = message.includes('?') || 
    message.match(/^(what|how|when|where|why|who|which|can|could|would|should|do|does|did|is|are|will|maxaa|maxay|muxuu|muxu|maxaad|maxaan|sida|sidaan|sidaad|goorma|goormay|meesha|halka|halkee|sababta|yaa|yaad|yaan|sidee|immisa|ma|miyuu|miyay|miyaad|miyaan)/i);
  
  if (isQuestion) {
    // How questions
    if (message.match(/^(how|sida|sidaan|sidaad|sidaay|sidaay|sidaan)/i)) {
      if (message.match(/(work|process|procedure|system|website|site|shaqeyso|shaqeyso|shaqeyso)/i)) {
        return language === 'somali' 
          ? "Dukaankeenu waa u fudud: Baariso buugaag → Ku dar cart-ka → Checkout → Soo dejiso. Waxaad ka raadisaa magaca, qoraaga, ama qaybta. Buugag bilaash ah way diyaar yihiin si degdeg ah, buugagta la bixiyana waxay u baahan yihiin iibsasho. Waa sidaas oo kale!"
          : `${websiteName} works simply: Browse books → Add to cart → Checkout → Download. You can search by title, author, or category. Free books are available immediately, and paid books require purchase. It's that easy!`;
      }
      if (message.match(/(long|time|duration|take|fast|quick|soon|dheer|waqti|degdeg|dhakhso|dhakhso)/i)) {
        return language === 'somali'
          ? "Buugagta digitalka ah way diyaar yihiin soo dejinta si degdeg ah kadib iibsashada - ma sugin! Habka soo dejinta waa degdeg ah. Buugag bilaash ah waxa la soo dejisan karaa si degdeg ah iibsasho la'aan."
          : "Digital books are available for download immediately after purchase - no waiting! The download process is instant. Free books can be downloaded right away without any purchase.";
      }
    }
    
    // What questions
    if (message.match(/^(what|maxaa|maxay|muxuu|waxaa)/i)) {
      if (message.match(/(book|books|collection|available|have|offer|buug|buugag|koox|haysataa)/i)) {
        return language === 'somali'
          ? "Waxaan bixinaa noocyada kala duwan ee buugaagta oo ay ka mid yihiin sheekooyin, sheekooyin aan ahayn, sayniska, taariikhda, iyo in ka badan. Waxaad ka baaris kartaa kooxdeena oo dhan website-ka. Nooca aad xiiseyneysid waa maxay?"
          : "We offer a wide variety of books across multiple genres including fiction, non-fiction, science, history, and more. You can browse our complete collection on the website. What genre interests you?";
      }
    }
    
    // When questions
    if (message.match(/^(when|goorma|marka|markii)/i)) {
      if (message.match(/(get|receive|download|available|delivery|arrive|hel|soo|dejiso|diyaar|gaadha)/i)) {
        return language === 'somali'
          ? "Buugagta digitalka ah way diyaar yihiin si degdeg ah kadib iibsashada - waxaad si degdeg ah u soo dejisan kartaa! Ma jiro sugin. Buugag bilaash ah way diyaar yihiin si degdeg ah iibsasho la'aan."
          : "Digital books are available immediately after purchase - you can download them right away! There's no waiting period. Free books are available instantly without purchase.";
      }
    }
    
    // Where questions
    if (message.match(/^(where|meesha|halka|halkee)/i)) {
      if (message.match(/(find|get|download|access|locate|see|view|hel|soo|dejiso|gaadha|arag)/i)) {
        return language === 'somali'
          ? "Waxaad ka heli kartaa buugaagta adoo baarisanaaya website-keena, adoo isticmaalaysa habka raadinta, ama adoo baarisanaaya qaybaha. Kadib iibsashada, waxaad ka soo dejisan kartaa buugaagta dashboard-ka akoonkaaga oo hoos ku jira 'Buugaagteyda' ama 'Soo dejinta'."
          : "You can find books by browsing our website, using the search feature, or exploring categories. After purchase, you can download books from your account dashboard under 'My Books' or 'Downloads'.";
      }
    }
    
    // Can/Could questions
    if (message.match(/^(can|could|may|ma|miyaan|miyaad|miyay)/i)) {
      if (message.match(/(buy|purchase|get|download|access|read|iibso|hel|soo|dejiso|akhri)/i)) {
        return language === 'somali'
          ? "Haa, si dhab ah! Waxaad ka baarisan kartaa, iibsan kartaa, oo soo dejisan kartaa buugaagta kooxdeena. Buugag bilaash ah way diyaar yihiin si degdeg ah, buugagta la bixiyana waxay u baahan yihiin iibsasho. Sidee ku caawin karaa inaad bilowdo?"
          : "Yes, absolutely! You can browse, purchase, and download books from our collection. Free books are available immediately, and paid books require purchase. How can I help you get started?";
      }
    }
  }
  
  // Default response
  return responses.default;
};
