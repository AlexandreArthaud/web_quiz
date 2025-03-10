let quiz = null;

document.addEventListener('DOMContentLoaded', function() {
	// Quiz Variables
	let quizContent = '';
	let language = '';
  let filters = [];

	// Quiz Form Elements
	const quizFileInput = document.getElementById('quizFileInput');
	const quizUserInput = document.getElementById('quizUserInput');
	const quizQuestionOutput = document.getElementById('quizQuestionContainer');
	const quizNextBtn = document.getElementById('quizNextBtn');
	const quizPreviousBtn = document.getElementById('quizPreviousBtn');
  const quizSayBtn = document.getElementById('quizSayBtn');
	const quizTTSBtn = document.getElementById('quizTTSBtn');
	const quizScrollBtn = document.getElementById('quizScrollBtn');
	const quizAnswerBtn = document.getElementById('quizAnswerBtn');
	const quizStartBtn = document.getElementById('quizStartBtn');
	const quizTypeSelect = document.getElementById('quizTypeSelect');
	const quizReversed = document.getElementById('reverseCheckbox');
	const quizRandomized = document.getElementById('randomizeCheckbox');
	const quizSmartMode = document.getElementById('smartModeCheckbox');
  const quizWordsOnly = document.getElementById('wordsOnlyCheckbox');
  const quizSentencesOnly = document.getElementById('sentencesOnlyCheckbox');
	const quizScore = document.getElementById('score');
  const quizQuestionCount = document.getElementById('questionCount');
	const quizSyllableLength = document.getElementById('syllableLength');
	const predefinedFiles = document.getElementById('predefinedFiles');
  const filterList = document.getElementById('filterList');
	const quizFilterArea = document.getElementById('quizFiltersArea');

	quizQuestionCount.addEventListener("change", function(event) {
		localStorage.setItem("lastLimit", event.target.value);
	});

	quizWordsOnly.addEventListener("change", function(event) {
		localStorage.setItem('filteringWords', event.target.checked);
		localStorage.removeItem("filteringSentences");
		quizSentencesOnly.checked = false;
	});
	quizSentencesOnly.addEventListener("change", function(event) {
		localStorage.setItem('filteringSentences', event.target.checked);
		localStorage.removeItem("filteringWords");
		quizWordsOnly.checked = false;
	});
	quizRandomized.addEventListener("change", function(event) {
		localStorage.setItem('randomized', event.target.checked);
	});
	quizSmartMode.addEventListener("change", function(event) {
		localStorage.setItem('smart', event.target.checked);
	});
	quizReversed.addEventListener("change", function(event) {
		localStorage.setItem("reversed", event.target.checked);
	});

  filterList.addEventListener("change", function(event) {
    filters.push(event.target.value);
		quizFilterArea.innerHTML += event.target.value + ', ';
    filterList.value = '';
  });

	quizTypeSelect.addEventListener('change', function(event) {
		localStorage.setItem('quizType', event.target.value);

		if (event.target.value === 'script') {
			quizSyllableLength.hidden = false;
		}
    else if (event.target.value === 'dev') {
      quizReversed.checked = true;
	    localStorage.setItem('reversed', true);
    }
    else if (event.target.value !== 'dev') {
      quizReversed.checked = false;
	    localStorage.setItem('reversed', false);
    }
		else {
			quizSyllableLength.hidden = true;
		}
	});

	quizFileInput.addEventListener('change', function(event) {
		const files = event.target.files;

		if (files) {
			let quizContent = '';
			let filesProcessed = 0;

			for (const file of files) {
				const reader = new FileReader();
				reader.onload = function(e) { 
					quizContent += e.target.result; 
					filesProcessed++;

					if (filesProcessed === files.length) {
						localStorage.setItem('quizContent', quizContent);
						language = getLanguageCodeFromName(files[0].name);
						
						let description = '';
						for (let item of files) {
							description += item.name + ', ';
						}
						localStorage.setItem("lastFiles", description);
						document.getElementById("selectedFileFeedback").innerHTML += description;
						localStorage.removeItem("lastPredefinedFile");
						predefinedFiles.value = '';
					}
				};
				reader.readAsText(file);
			}
		}
	});

	predefinedFiles.addEventListener('change', async function(event) {
		const filePath = event.target.value;
		if (!filePath) { return; }

		localStorage.setItem('lastPredefinedFile', filePath);
		document.getElementById("selectedFileFeedback").innerHTML = '';
		localStorage.removeItem('lastFiles');

		fetch(filePath) 
			.then(response => {
				if (!response.ok) throw new Error("File not found!");
				language = getLanguageCodeFromName(filePath);
				localStorage.setItem('language', language);
				return response.text();
			})
			.then(text => {
				localStorage.setItem('quizContent', text);
			})
			.catch(error => {
				console.log("Error" + error.message);
			});
	});

	quizNextBtn.addEventListener('click', function(event) { 
    event.preventDefault();
    setTimeout(() => quizUserInput.focus(), 0);
    quiz.next(false); 
  });
	quizPreviousBtn.addEventListener('click', function() { 
    event.preventDefault();
    setTimeout(() => quizUserInput.focus(), 0);
    quiz.previous(); 
  });
  quizSayBtn.addEventListener('click', function() {
    event.preventDefault();
    setTimeout(() => quizUserInput.focus(), 0);
    quiz.sayQuestion();
  });
	quizTTSBtn.addEventListener('click', function() { 
    event.preventDefault();
    setTimeout(() => quizUserInput.focus(), 0);
		quiz.toggleTTS(); 
		quizTTSBtn.style.backgroundColor =  quiz.ttsModeEnabled ? 'blue' : 'grey';
	});
	quizScrollBtn.addEventListener('click', function() { 
    event.preventDefault();
    setTimeout(() => quizUserInput.focus(), 0);
		quiz.toggleScrollMode();
		quizScrollBtn.style.backgroundColor = quiz.scrollModeEnabled ? 'blue' : 'grey';
	 });
	quizAnswerBtn.addEventListener('click', function(event) { 
    event.preventDefault();
    setTimeout(() => quizUserInput.focus(), 0);
    quiz.showAnswer(); 
  });
	quizUserInput.addEventListener('input', function(event) { quiz.testAnswer(event.target.value)});

	quizStartBtn.addEventListener('click', function() { 
		// trying to remember values in case reloaded
		if (!quizContent) {
			quizContent = localStorage.getItem('quizContent');
		}
		if (!language) {
			language = localStorage.getItem('language');
		}

		// creating the right script type
		if (quizTypeSelect.value === 'script') {
			quiz = new ScriptQuiz(quizContent, quizUserInput, quizQuestionOutput);
			quiz.syllable_length = quizSyllableLength.value;
		}
		else {
			quiz = new Quiz(quizContent, quizUserInput, quizQuestionOutput);
		}

		if (quizTypeSelect.value === 'dev') { 
      quiz.symbolSet = 'dev';
			quiz.symbols = {
				'separator': ' : ',
				'or': ' OU ',
				'and': ' ET ',
				'then': ' APRES ',
			}
		}

		quiz.speaker.changeLanguage(language);
		quiz.scoreLabel = quizScore;

		if (quizReversed.checked) { quiz.reversed = true; }
		if (!quizRandomized.checked) { quiz.shuffled = false }
    if (!quizSmartMode.checked) { quiz.smartMode = false }
    if (quizWordsOnly.checked) { quiz.filters.push("words") }
    if (quizSentencesOnly.checked) { quiz.filters.push("sentences") }
    if (filters) { quiz.parse_filters = filters; }
    if (parseInt(quizQuestionCount.value)) { 
      quiz.limit = parseInt(quizQuestionCount.value);
    }

		quiz.start(); 
	});

	// Startup work so user doesn't have to always reenter settings (default behavior = reusing last settings)
	
	/// Remembering last files worked on
	if (localStorage.getItem("lastPredefinedFile")) {
		predefinedFiles.value = localStorage.getItem("lastPredefinedFile");
	}
	else if (localStorage.getItem("lastFiles")) {
		document.getElementById("selectedFileFeedback").innerHTML += localStorage.getItem("lastFiles");
	}
	
	/// Remembering last limit set
	if (localStorage.getItem('lastLimit')) {
		quizQuestionCount.value = localStorage.getItem('lastLimit');
	}

	/// Remembering last general quiz options (not mutually exclusive)
	if (localStorage.getItem('randomized')) {
		randomizeCheckbox.checked = localStorage.getItem('randomized') === 'true';
	}
	if (localStorage.getItem('smart')) {
		smartModeCheckbox.checked = localStorage.getItem('smart') === 'true';
	}
	if (localStorage.getItem('reversed')) {
		reverseCheckbox.checked = localStorage.getItem('reversed') === 'true';
	}

	/// Remembering which filter was used last (mutually exclusive)
	if (localStorage.getItem('filteringWords')) {
		quizWordsOnly.checked = localStorage.getItem('filteringWords') === 'true';
	}
	else if (localStorage.getItem('filteringSentences')) {
		quizSentencesOnly.checked = localStorage.getItem('filteringSentences') === 'true';
	}

	/// Remembering quiz type
	if (localStorage.getItem("quizType")) {
		quizTypeSelect.value = localStorage.getItem("quizType");
	}
});
