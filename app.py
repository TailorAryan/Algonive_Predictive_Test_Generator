from flask import Flask, request, jsonify, send_from_directory
from predictor import MarkovModel
import os

app = Flask(__name__, static_folder='.')

# Initialize global model
model = MarkovModel(n=2)

# Initial training data
initial_corpus = """
hello how are you today
hope you are doing well
thank you for your message
i will get back to you soon
let me know if you need anything
have a great day ahead
it was nice meeting you
please let me know your thoughts
can we schedule a meeting next week
i am interested in this project
looking forward to hearing from you
the weather is beautiful today
what are your plans for the weekend
i would love to help with that
let us discuss this further
could you please send me the files
"""
model.train(initial_corpus)

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_proxy(path):
    return send_from_directory('.', path)

@app.route('/api/predict', methods=['POST'])
def predict():
    data = request.json
    text = data.get('text', '')
    predictions = model.predict(text)
    return jsonify({'predictions': predictions})

@app.route('/api/train', methods=['POST'])
def train():
    data = request.json
    text = data.get('text', '')
    if text:
        model.train(text)
        return jsonify({'status': 'success', 'message': 'Model trained successfully'})
    return jsonify({'status': 'error', 'message': 'No text provided'}), 400

@app.route('/api/settings', methods=['POST'])
def update_settings():
    data = request.json
    n = data.get('n', 2)
    model.set_n(n)
    return jsonify({'status': 'success', 'n': model.n})

@app.route('/api/clear', methods=['POST'])
def clear():
    model.clear()
    return jsonify({'status': 'success', 'message': 'Dictionary cleared'})

@app.route('/api/status', methods=['GET'])
def status():
    return jsonify({
        'n': model.n,
        'patterns': len(model.chains),
        'vocab_size': len(model.vocabulary)
    })

if __name__ == '__main__':
    print("Starting PredictFlow Python API...")
    app.run(debug=True, port=5000)
