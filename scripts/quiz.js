class Speaker {
	constructor() {
		this.language = 'en';
		this.separator = ' : ';
		this.voice = null;

		this.setVoice();
	}

	async say(text) {
		return new Promise((resolve, reject) => {
        	let utterance = new SpeechSynthesisUtterance();
        	utterance.text = text;
        	utterance.voice = this.voice;
			utterance.onend = () => resolve();
			utterance.onerror = (event) => reject(event.error);
			window.speechSynthesis.speak(utterance);
		})
    }

	async sayIn(text, language) {
		const originalLanguage = this.language;
		this.changeLanguage(language);
		await this.say(text);
		this.changeLanguage(originalLanguage);
	}

	changeLanguage(language) {
		this.language = language;
		this.setVoice();
	}

  setFilteredVoice(voices) {
    this.voice = voices.filter(voice => {
      if (voice.lang.startsWith(this.language)) { return true; }
		})[0];
	}

	setVoice() {
		let voices = window.speechSynthesis.getVoices();
		
		if (voices.length > 0) {
			this.setFilteredVoice(voices);
		}
		else {
		    window.speechSynthesis.addEventListener("voiceschanged", () => {
			    this.setFilteredVoice(window.speechSynthesis.getVoices())
		    });
		}
	}
}

class BaseQuiz {
	constructor(text, userInput, questionOutput) {
		this.speaker = new Speaker()
		this.text = text;
		this.userInput = userInput;
		this.questionOutput = questionOutput;
		this.shuffled = true;
    this.reversed = false;
    this.smart = true;
    this.active = false;

		this.score = 0;
		this.scoreLabel = null;

    this.filters = []
    this.parse_filters = []
    this.limit = 0;

		// info to validate a question
		this.currentExpectedAnswers = [];
		this.currentSequenceIndex = 0;

		// syntax
    this.symbolSet = 'base';
		this.symbols = {
			'separator': ' : ',
			'or': ' / ',
			'and': ' ; ',
			'then': ' => ',
		}
	}

	parseContent() {
		throw new Error("parseContent must be implemented by the child class.")
	}

	start() {
    this.active = true;
		this.questions = this.parseContent();
		if (this.shuffled) { shuffle(this.questions); }
		if (this.reversed) { this.reverse() }
    if (this.filters) { this.filter() }
    if (this.limit > 0) { this.questions = this.questions.slice(0, this.limit); }
		this.currentIndex = -1;
		this.next(false);
		this.answerShown = false;
		if (this.scrollModeEnabled) { this.scrollModeEnabled = false; }
		// if (this.ttsModeEnabled) { this.ttsModeEnabled = false; } WHY?
	}

	updateScore() {
    if (this.smart) {
		  this.scoreLabel.innerHTML = `${this.questions.length}`
    }
    else {
		  this.scoreLabel.innerHTML = `${this.score}/${this.questions.length}`
    }
	}

  end() {
    this.questionOutput.innerHTML = "Well done!";
    this.active = false;
  }

	async next(userWasCorrect = true) {
	

    if (this.smart && userWasCorrect) {
      this.questions.splice(this.currentIndex, 1);
      if (this.currentIndex >= this.questions.length) {
        this.currentIndex = 0;
      }
      if (this.questions.length == 0) {
        this.end();
      }
      this.updateScore();
    }
    else {
		  this.updateScore();
		  this.currentIndex++;
    }

		if (this.currentIndex > this.questions.length - 1) { this.currentIndex = 0; }
		this.userInput.value = '';

    if (this.questions.length > 0) {
		  this.questionOutput.innerHTML = this.questions[this.currentIndex].split(this.symbols.separator)[0]
    }

		this.answerShown = false;

		if (this.questions.length <= 0) {
			return;
		}

		if (this.ttsModeEnabled && !this.scrollModeEnabled) {
			let word = this.questions[this.currentIndex].split(this.symbols.separator)[0].trim();
			const match = word.match(/^\*?([^#\//!<>{}"]+)/);
			if (match) { word = match[1]; }
			await this.speaker.say(word)
		}
	}

	previous() {
		this.currentIndex--;
		if (this.currentIndex < 0) { this.currentIndex = this.questions.length - 1; }
		this.userInput.value = '';
		this.questionOutput.innerHTML = this.questions[this.currentIndex].split(this.symbols.separator)[0];
		this.answerShown = false;
	}

	reverse() {
		this.questions = this.questions.map(item => {
			const [question, answer] = item.split(this.symbols.separator);
			return `${answer} : ${question}`;
		});
	}

	showAnswer() {
		let answer = '<br><span id="answer">' + this.questions[this.currentIndex].split(this.symbols.separator)[1] + '</span>';
		if (!this.answerShown) {
			this.questionOutput.innerHTML += answer;
			this.answerShown = true;
		}
	}

  showFeedback(message) {
    if (!this.questionOutput.innerHTML.includes(message)) {
      this.questionOutput.innerHTML += message;
    }
   }

	testAnswer(userAnswer) {
		if (!this.active) {
			if (userAnswer == ":restart") {
				this.start();
			}
			return;
		}
		let answer = this.questions[this.currentIndex].split(this.symbols.separator)[1];
    userAnswer = userAnswer.trim();

    if (this.symbolSet == 'base') {
		  answer = answer.match(/^[^#"{[\]<]+/)[0];
      answer = answer.trim();
      answer = answer.toLowerCase();
		  userAnswer = userAnswer.toLowerCase();
    }
    else if (this.symbolSet == 'dev' && answer.startsWith('\#')) {
	    answer = answer.splice(0);
	    answer = answer.trim()
    }
    else {
      answer = answer.trim();
    }

		if (userAnswer.startsWith(':')) {
			if ([':n'].includes(userAnswer)) { 
				this.score = 0; 
				this.userInput.value = ''; 
				this.updateScore();
				this.next(false);
			}
			else if ([':p'].includes(userAnswer)) { 
				this.userInput.value = ''; 
				this.previous(); 
			}
			else if ([':h', ':ا'].includes(userAnswer)) { 
				this.score = 0;
				this.userInput.value = ''; 
				this.updateScore();
				this.showAnswer(); 
			}
      else if ([':s'].includes(userAnswer)) {
        this.sayQuestion()
        this.userInput.value = '';
      }
		}
		else if (userAnswer === answer) {
			this.score++;
			this.next();
		}
		else if (!answer.includes(this.symbols.or)   && 
			     !answer.includes(this.symbols.and)  && 
				 !answer.includes(this.symbols.then) && 
				 (answer.includes('(') && answer.includes(')')) ||
				 answer.includes('/')  && !answer.includes(' / ') && !answer.includes(' ; ') && !answer.includes(' => ')) {

      let options = [answer]
      if (this.symbolSet == 'base') {
			  options = generateCombinations([answer]);
      }

			if (options.includes(userAnswer)) {
				this.score++;
				this.next();
			}
		}
		else if (answer.includes(this.symbols.or) && !answer.includes(this.symbols.and) && !answer.includes(this.symbols.then)) {
			let options = answer.split(this.symbols.or);
      if (this.symbolSet == 'base') {
			  options = generateCombinations(options);
      }


			if (options.includes(userAnswer)) {
				this.score++;
				this.next();
			}
		}
		else if (answer.includes(this.symbols.and) && !answer.includes(this.symbols.then)) {
			const expectedAnswers = answer.split(this.symbols.and);

			for (const expectedAnswer of expectedAnswers) {
				let options = expectedAnswer.split(this.symbols.or);
        if (this.symbolSet == 'base') {
			    options = generateCombinations(options);
        }

				if (options.includes(userAnswer)) {
					if (!this.currentExpectedAnswers.includes(expectedAnswer)) {
						this.currentExpectedAnswers.push(expectedAnswer)
					}
					this.userInput.value = '';
					this.questionOutput.innerHTML += '<span id="answer"><br>- A valid answer was given, there are more</span>'
				}
			}
			
			if (expectedAnswers.every(element => this.currentExpectedAnswers.includes(element))) {
				this.score++;
				this.next();
				this.currentExpectedAnswers = [];
			}
		}
		else if (answer.includes(this.symbols.then)) {
			const sequentiallyExpectedAnswers = answer.split(this.symbols.then);
			for (let i = 0; i < sequentiallyExpectedAnswers.length; i++) {
				 if (i != this.currentSequenceIndex) { continue; } // only checking current index
			
				// faulty code: validating twice works
				const expectedAnswers = sequentiallyExpectedAnswers[i].split(this.symbols.and);
				for (const expectedAnswer of expectedAnswers) {
					let options = expectedAnswer.split(this.symbols.or);
          if (this.symbolSet == 'base') {
			      options = generateCombinations(options);
          }

					if (options.includes(userAnswer)) {
						if (!this.currentExpectedAnswers.includes(expectedAnswer)) {
							this.currentExpectedAnswers.push(expectedAnswer)
						}
						this.userInput.value = '';
						// this.questionOutput.innerHTML += '<span id="answer"><br>- A valid answer was given, there are more</span>'
						this.showFeedback('<span id="answer"><br>- A valid answer was given, there are more</span>');
					}
				}
			
				if (expectedAnswers.every(element => this.currentExpectedAnswers.includes(element))) {
					this.currentExpectedAnswers = [];
					this.currentSequenceIndex++;
				}
			}

			if (this.currentSequenceIndex === sequentiallyExpectedAnswers.length) {
				this.score++;
				this.next();
				this.currentSequenceIndex = 0;
			}
		}
	}
	
	async toggleTTS() {
		this.ttsModeEnabled = !(this.ttsModeEnabled);
        if (!this.ttsModeEnabled) { return; }		

    let word = this.questions[this.currentIndex].split(this.symbols.separator)[0].trim();
	  const match = word.match(/^\*?([^#\//!<>{}"]+)/);
    if (match) { word = match[1]; }
    await this.speaker.say(word)
	}

  async sayQuestion() {
    let word = this.questions[this.currentIndex].split(this.symbols.separator)[0].trim();
	  const match = word.match(/^\*?([^#\//!<>{}"]+)/);
    if (match) { word = match[1]; }
    await this.speaker.say(word)
  }

	async toggleScrollMode() {
		this.scrollModeEnabled = !(this.scrollModeEnabled);
		if (!this.scrollModeEnabled) { return; }

		do {
			if (this.ttsModeEnabled) {
				let word = this.questions[this.currentIndex].split(this.symbols.separator)[0].trim();
				const match = word.match(/^\*?([^#\//!<>{}"]+)/);
				if (match) { word = match[1]; }
				await this.speaker.say(word)

				let translation = this.questions[this.currentIndex].split(this.symbols.separator)[1].trim()
				translation = translation.replace(/[<>]/g, '');
				await this.speaker.sayIn(translation, 'en')
			}
			else {
				await this.delay(2000);
			}

			if (this.scrollModeEnabled) {
				this.next(false);
			}
		} while(this.scrollModeEnabled);
	}

	delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

  filter(key, questions) {
    const countLeadingWhitespace = str => (str.match(/^[ \t]+/) || [''])[0].length;

    const getUniqueIndents = (lines) => {
      const indents = new Set(lines.map(line => countLeadingWhitespace(line)));
      return indents; 
    };

    if (this.filters.includes("words")) {
      let baseIndent = Math.min(...getUniqueIndents(this.questions))
      this.questions = this.questions.filter((question) => countLeadingWhitespace(question) > baseIndent);
    }
    else if (this.filters.includes("sentences")) {
      let baseIndent = Math.min(...getUniqueIndents(this.questions))
      this.questions = this.questions.filter((question) => countLeadingWhitespace(question) == baseIndent);
    }
  }
}

class Quiz extends BaseQuiz {
	constructor(text, userInput, questionOutput) {
		super(text, userInput, questionOutput);
	}

	parseContent() {
    let content = []
    if (this.parse_filters.length) {
      let registering = false;
      for (let element of this.text.split('\n')) {
        if (element.trim().startsWith('#') && this.parse_filters.some(item => element.includes(item))) {
          registering = true;
        }
        else if (element.trim().startsWith('#') && !this.parse_filters.some(item => element.includes(item))) {
          registering = false;
        }

        if (registering) {
          if (element.includes(this.symbols.separator)) {
            content.push(element)
          }
        }
      }
    }
    else {
      if (this.symbolSet == 'base') {
		    content = this.text.split('\n').filter((line) => line.includes(this.symbols.separator) && !line.trim().startsWith('#'));
      }
      else {
		    content = this.text.split('\n').filter((line) => line.includes(this.symbols.separator));
      }
    }
    return content;
	}
}

class ScriptQuiz extends BaseQuiz {
	constructor(text, userInput, questionOutput) {
		super(text, userInput, questionOutput);
		this.syllable_length = 2;
	}

	parseContent() {
		let scriptData = [];
		const lines = this.text.replace(/\r/g, '').split('\n');

		let currentHeading = null;
		lines.forEach(line => {
			if (line.startsWith('#')) { currentHeading = line.split(' ')[1]; return; }
			else if (!line.includes(this.symbols.separator)) { return; }

			scriptData.push({ 	
								'type': currentHeading,
								'character': line.split(this.symbols.separator)[0],
								'transliteration': line.split(this.symbols.separator)[1]
							});
		});

		if (this.speaker.language == 'ko') {
			return this.generateKoreanQuestions(scriptData, 30);
		}
		if (this.speaker.language == 'ja') {
			return this.generateJapaneseQuestons(scriptData, 30);
		}
    if (this.speaker.language == 'zh') {
      return this.generateChineseQuestions(scriptData);
    }
		return this.generateQuestions(scriptData, 30);
	}

	generateQuestions(scriptData, count) {
		let questions = [];
		for (let i = 0; i < count ; i++) {
			let syllable = this.generateSyllable(scriptData, 2 + Math.floor(Math.random() * this.syllable_length));
			let transliteration = syllable.map(item => item.transliteration).join('');
			questions.push(syllable.map(item => item.character).join('') + ' : ' + transliteration);
		}
		return questions;
	}

	generateSyllable(scriptData, length) {
		let syllable = [];
		for (let i = 0 ; i < length ; i++) {
			let randomItem = scriptData[Math.floor(Math.random() * scriptData.length)];
			
			if (i === 0 && this.speaker.language === 'ar') {
				while (["a","i","u"].includes(randomItem)) {
					randomItem = scriptData[Math.floor(Math.random() * scriptData.length)];
				}
			}

			syllable.push(randomItem);
		}
		return syllable;
	}

	generateJapaneseQuestons(scriptData, count) {
		let questions = [];
		let type =  '';
		for (let i = 0; i < count ; i ++) {
			if (i % 2 == 0) {
				type = 'Hiragana';
			}
			else {
				type = 'Katakana';
			}

			let japaneseSyllable = this.generateJapaneseWord(scriptData, 3 + Math.floor(Math.random() * 2), type);
			let transliteration = japaneseSyllable.map(item => item.transliteration.trim()).join('');
			japaneseSyllable = japaneseSyllable.map(item => item.character.trim()).join('');
			questions.push(japaneseSyllable + ' : ' + transliteration);
		}
		return questions;
	}

	generateJapaneseWord(scriptData, length, type) {
		scriptData = scriptData.filter(item => item.type.includes(type));
		let syllable = [];
		for (let i = 0 ; i < length ; i++) {
			let randomItem = scriptData[Math.floor(Math.random() * scriptData.length)];
			syllable.push(randomItem);
		}
		return syllable;
	}

	generateKoreanQuestions(scriptData, count) {
		let questions = [];
		for (let i = 0; i < count ; i ++) {
			let koreanSyllable = this.generateKoreanSyllable(scriptData, 2 + Math.floor(Math.random() * 2));

			let transliteration = koreanSyllable.map(item => item.transliteration.trim()).join('');
			koreanSyllable = koreanSyllable.map(item => item.character.trim()).join('');
			let combinedSyllable = ''
			if (koreanSyllable.length == 2) {
				combinedSyllable = generateHangul(koreanSyllable[0], koreanSyllable[1]);
			}
			else if (koreanSyllable.length == 3) {
				combinedSyllable = generateHangul(koreanSyllable[0], koreanSyllable[1], koreanSyllable[2]);
			}
			questions.push(combinedSyllable + ' : ' + transliteration);
		}
		return questions;
	}

	generateKoreanSyllable(scriptData, length) {
		let syllable = [];
		for (let i = 0 ; i < length ; i++) {
			if (i == 0) {
				// Choseong, initial, needed
				let consonants = scriptData.filter(item => item.type.includes('Consonants'));
				syllable.push(consonants[Math.floor(Math.random() * consonants.length)])
			}
			else if (i == 1) {
				// jungseongs (vowel), needed
				let vowels = scriptData.filter(item => item.type.includes('Vowels'));
				syllable.push(vowels[Math.floor(Math.random() * vowels.length)])
			}
			else if (i == 2) {
				// jongseong, optional
				let consonants = scriptData.filter(item => 
					['Consonants', 'Jongseong'].includes(item.type.trim()) 
					&& !['ㄸ', 'ㅃ', 'ㅉ'].includes(item.character.trim())
				);
				syllable.push(consonants[Math.floor(Math.random() * consonants.length)])
			}
		}
		return syllable;
	}

  generateChineseQuestions(scriptData) {
    const countLeadingWhitespace = str => (str.match(/^\s*/) || [""])[0].length;
 
    let questions = []
    for (let line of scriptData) {
      let entries = line.character.trim().split(' ');
      let base_entry = entries[0];
      do {
        if (base_entry == '*') {
          entries.shift();
          base_entry = entries[0];
        }
      } while (base_entry == '*');

      if (base_entry.length == 1) {
        let pinyin =  line.character.substring(line.character.search("\"") + 1);
        let match = pinyin.match(/^\p{L}+/u);
        const result = match ? match[0] : pinyin;

        if (!this.reversed) {
          questions.push(`${base_entry} : ${result}`);
        }
        else {
          questions.push(`${base_entry} : ${line.transliteration}`);
        }
      }
    }
    return questions;
  }
  
  testAnswer(userAnswer) {
    super.testAnswer(userAnswer);

    if (userAnswer == '？') {
      this.userInput.value = '';
      this.showAnswer();
    }
  }
}
