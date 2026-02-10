document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const textInput = document.getElementById('text-input');
    const suggestionsBar = document.getElementById('suggestions-bar');
    const corpusInput = document.getElementById('corpus-input');
    const trainBtn = document.getElementById('train-btn');
    const clearBtn = document.getElementById('clear-btn');
    const nGramSelect = document.getElementById('n-gram-select');
    const autoLearnToggle = document.getElementById('auto-learn');
    const wordCountDisplay = document.getElementById('word-count');
    const modelStatusDisplay = document.getElementById('model-status');

    // Debounce timer for API calls
    let predictTimeout;

    // Initial Status
    updateModelStatus();

    // Event Listeners
    textInput.addEventListener('input', (e) => {
        const text = e.target.value;
        updateWordCount(text);

        // Debounce predictions
        clearTimeout(predictTimeout);
        predictTimeout = setTimeout(() => {
            fetchPredictions(text);
        }, 300);

        // Auto-learn if enabled
        if (autoLearnToggle.checked && text.trim().endsWith('.')) {
            const lastSentence = text.trim().split('.').pop();
            if (lastSentence) {
                trainModel(lastSentence);
            }
        }
    });

    // Handle keydown for Tab/Enter selection
    textInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
            const firstSuggestion = suggestionsBar.querySelector('.suggestion-chip');
            if (firstSuggestion) {
                e.preventDefault();
                insertSuggestion(firstSuggestion.textContent);
            }
        }
    });

    trainBtn.addEventListener('click', () => {
        const newText = corpusInput.value;
        if (newText.trim()) {
            trainModel(newText);
            corpusInput.value = '';
        }
    });

    clearBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to clear the dictionary?')) {
            try {
                const response = await fetch('/api/clear', { method: 'POST' });
                if (response.ok) {
                    textInput.value = '';
                    renderSuggestions([]);
                    updateModelStatus();
                    showToast('Dictionary cleared.');
                }
            } catch (err) {
                console.error('Error clearing model:', err);
            }
        }
    });

    nGramSelect.addEventListener('change', async (e) => {
        try {
            await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ n: parseInt(e.target.value) })
            });
            updateModelStatus();
        } catch (err) {
            console.error('Error updating settings:', err);
        }
    });

    // API Interaction Functions
    async function fetchPredictions(text) {
        if (!text.trim()) {
            renderSuggestions([]);
            return;
        }

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            const data = await response.json();
            renderSuggestions(data.predictions);
        } catch (err) {
            console.error('Error fetching predictions:', err);
        }
    }

    async function trainModel(text) {
        try {
            const response = await fetch('/api/train', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (response.ok) {
                showToast('Model trained successfully! ✨');
                updateModelStatus();
            }
        } catch (err) {
            console.error('Error training model:', err);
        }
    }

    async function updateModelStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            const nMap = { '1': 'Unigram', '2': 'Bigram', '3': 'Trigram' };
            modelStatusDisplay.textContent = `Model: ${nMap[data.n]} (${data.patterns} patterns)`;
        } catch (err) {
            console.error('Error getting status:', err);
        }
    }

    // UI Helper Functions
    function renderSuggestions(predictions) {
        suggestionsBar.innerHTML = '';

        if (!predictions || predictions.length === 0) {
            suggestionsBar.innerHTML = '<span class="placeholder-text">Continue typing...</span>';
            return;
        }

        predictions.forEach(word => {
            const chip = document.createElement('div');
            chip.className = 'suggestion-chip';
            chip.textContent = word;
            chip.addEventListener('click', () => insertSuggestion(word));
            suggestionsBar.appendChild(chip);
        });
    }

    function insertSuggestion(word) {
        const currentValue = textInput.value;
        // Check if last character is space
        const separator = currentValue.endsWith(' ') ? '' : ' ';
        textInput.value = currentValue + separator + word + ' ';
        textInput.focus();

        // Refresh predictions
        fetchPredictions(textInput.value);
        updateWordCount(textInput.value);
    }

    function updateWordCount(text) {
        const count = text.trim() ? text.trim().split(/\s+/).length : 0;
        wordCountDisplay.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    }

    function showToast(message) {
        const originalStatus = modelStatusDisplay.textContent;
        modelStatusDisplay.textContent = message;
        modelStatusDisplay.style.color = 'var(--accent)';
        setTimeout(() => {
            updateModelStatus();
            modelStatusDisplay.style.color = 'var(--text-secondary)';
        }, 2000);
    }
});
