import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import PyPDF2
import docx

# Load environment variables from .env file
load_dotenv()

# Configure the Gemini API key
try:
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
except Exception as e:
    print(f"Error configuring Gemini API: {e}")
    # You might want to exit or handle this more gracefully
    exit()


# --- Text Extraction Functions ---
def extract_text_from_pdf(file_stream):
    """Extracts text from a PDF file stream."""
    try:
        reader = PyPDF2.PdfReader(file_stream)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_docx(file_stream):
    """Extracts text from a DOCX file stream."""
    try:
        doc = docx.Document(file_stream)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return ""

def extract_text_from_txt(file_stream):
    """Extracts text from a TXT file stream."""
    try:
        return file_stream.read().decode('utf-8')
    except Exception as e:
        print(f"Error reading TXT: {e}")
        return ""

# --- Flask App Initialization ---
app = Flask(__name__)
# Enable CORS to allow your frontend to communicate with this backend
CORS(app)

# --- AI Contradiction Analysis Function ---
def analyze_contradictions_with_gemini(documents):
    """
    Uses the Gemini API to find contradictions in the provided documents.
    `documents` is a dictionary where keys are filenames and values are the text content.
    """
    if not documents:
        return {"error": "No documents provided for analysis."}

    # Create the AI model instance
    model = genai.GenerativeModel('gemini-1.5-flash')

    # Construct the prompt for the AI
    prompt_parts = [
        "You are an expert document analysis agent. Your task is to find contradictions between the following documents.\n\n"
    ]

    for filename, content in documents.items():
        prompt_parts.append(f"--- Document: {filename} ---\n")
        prompt_parts.append(content)
        prompt_parts.append("\n----------------------------------\n\n")

    prompt_parts.append(
        """
        Analyze the documents above and identify any contradictions. For each contradiction you find, provide a response in a JSON object with the following structure:
        {
          "contradictions": [
            {
              "id": an integer index starting from 1,
              "type": "A short, descriptive category of the conflict (e.g., 'Time Conflict', 'Policy Conflict')",
              "severity": "Rate the severity on a scale of 'Low', 'Medium', or 'High'",
              "description": "A one-sentence summary of the contradiction.",
              "details": "A detailed explanation quoting the conflicting parts from the documents.",
              "sources": ["filename1.ext", "filename2.ext"],
              "suggestion": "A clear, actionable suggestion to resolve the conflict.",
              "confidence": a float between 0.0 and 1.0 indicating your confidence in this finding
            }
          ]
        }
        If you find no contradictions, return an empty list: {"contradictions": []}.
        Only return the JSON object, with no other text before or after it.
        """
    )
    
    print("Sending prompt to Gemini...")

    try:
        # Generate content with Gemini
        response = model.generate_content(prompt_parts)
        # Clean the response to ensure it's valid JSON
        cleaned_response = response.text.strip().replace('```json', '').replace('```', '')
        return cleaned_response
    except Exception as e:
        print(f"An error occurred during Gemini API call: {e}")
        return f'{{"error": "Failed to communicate with AI model: {str(e)}"}}'


# --- API Endpoint for Analysis ---
@app.route('/analyze', methods=['POST'])
def analyze_documents():
    """API endpoint to receive files, extract text, and run analysis."""
    if 'files' not in request.files:
        return jsonify({"error": "No files part in the request"}), 400

    files = request.files.getlist('files')
    if len(files) < 2:
        return jsonify({"error": "Please upload at least two documents"}), 400

    # Process uploaded files
    documents_text = {}
    for file in files:
        filename = file.filename
        content = ""
        if filename.endswith('.pdf'):
            content = extract_text_from_pdf(file.stream)
        elif filename.endswith('.docx'):
            content = extract_text_from_docx(file.stream)
        elif filename.endswith('.txt'):
            content = extract_text_from_txt(file.stream)
        
        if content:
            documents_text[filename] = content
        else:
            print(f"Could not extract text from {filename}")


    if not documents_text or len(documents_text) < 2:
         return jsonify({"error": "Could not extract text from at least two of the uploaded documents."}), 400

    # Get analysis from Gemini
    analysis_result_json = analyze_contradictions_with_gemini(documents_text)
    
    # Return the raw JSON string from Gemini
    return analysis_result_json, 200, {'Content-Type': 'application/json'}


# --- Main Entry Point ---
if __name__ == '__main__':
    # Runs the Flask app on localhost, port 5000
    app.run(debug=True, port=5000)