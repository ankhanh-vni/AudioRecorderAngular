from google.cloud import storage
from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import cloud_speech
import os
from flask import Flask, request, jsonify
import tempfile
from openai import OpenAI
from flask_cors import CORS, cross_origin

# Change id and project name
project_id = "fluent-alliance-417101"
bucket_name = "example-speech-to-text-000"

# OpenAI API key
api_key = "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"


def upload_to_gcs(bucket_name: str, source_file_name: str, destination_blob_name: str):
    """Uploads a file to the bucket."""
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(destination_blob_name)

    blob.upload_from_filename(source_file_name)

    print(f"File {source_file_name} uploaded to {destination_blob_name}.")

def transcribe_batch_gcs_input_inline_output_v2(
    project_id: str,
    gcs_uri: str,
    transcription_file: str = "transcript.txt",
) -> cloud_speech.BatchRecognizeResults:
    """Transcribes audio from a Google Cloud Storage URI.

    Args:
        project_id: The Google Cloud project ID.
        gcs_uri: The Google Cloud Storage URI.
    Returns:
        The RecognizeResponse.
    """
    # Instantiates a client
    client = SpeechClient()

    config = cloud_speech.RecognitionConfig(
        auto_decoding_config=cloud_speech.AutoDetectDecodingConfig(),
        language_codes=["vi-VN"],
        model="long",
    )

    file_metadata = cloud_speech.BatchRecognizeFileMetadata(uri=gcs_uri)

    request = cloud_speech.BatchRecognizeRequest(
        recognizer=f"projects/{project_id}/locations/global/recognizers/_",
        config=config,
        files=[file_metadata],
        recognition_output_config=cloud_speech.RecognitionOutputConfig(
            inline_response_config=cloud_speech.InlineOutputConfig(),
        ),
    )

    # Transcribes the audio into text
    operation = client.batch_recognize(request=request)

    print("Waiting for operation to complete...")
    response = operation.result(timeout=None)

    for result in response.results[gcs_uri].transcript.results:
        if result.alternatives:
            with open(transcription_file, "a", encoding="utf-8") as f:
                f.write(f"{result.alternatives[0].transcript}")
            print(f"{result.alternatives[0].transcript}")

    return response.results[gcs_uri].transcript

# Set up the necessary variables

# folder = "D:\\Admin-new\\Desktop\\bidv-java-edu\\ghiam"
# destination_blob_name = "test_ghi_am"
# Upload the audio file to GCS
# for file in os.listdir(folder):
#     if file.endswith(".wav"):
#         source_file_name = os.path.join(folder, file)
#         file_name_without_extension = os.path.splitext(file)[0]
#         destination_transcript_name = os.path.join(folder, f"{file_name_without_extension}_transcript.txt")
#         upload_to_gcs(bucket_name, source_file_name, destination_blob_name)

#         # Construct the GCS URI
#         gcs_uri = f"gs://{bucket_name}/{destination_blob_name}"

#         # Transcribe the audio from the GCS URI
#         response = transcribe_batch_gcs_input_inline_output_v2(project_id, gcs_uri, destination_transcript_name)


app = Flask(__name__)
CORS(app)

@app.route('/upload', methods=['POST'])
@cross_origin()
def upload_file_and_summarize():
    if 'file' not in request.files:
        print("No file part in the request")
        return jsonify({'error': 'No file part in the request'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
        file.save(temp.name)
        source_file_name = temp.name

    destination_blob_name = temp.name.split("/")[-1]
    upload_to_gcs(bucket_name, source_file_name, destination_blob_name)

    gcs_uri = f"gs://{bucket_name}/{destination_blob_name}"
    response = transcribe_batch_gcs_input_inline_output_v2(project_id, gcs_uri)

    # Extract the transcript from the response
    transcript = ""
    for result in response.results:
        transcript += result.alternatives[0].transcript
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes Vietnamese meeting transcriptions."},
            {"role": "user", "content": f"Tóm tắt đoạn ghi âm cuộc họp sau thành biên bản tóm tắt cuộc họp 300 từ:\n\n{transcript}"}
        ],
        temperature=0.7,
    )
    summary = response.choices[0].message.content.strip()
    transcript = summary
    # Return the transcript as a JSON response
    return jsonify({'transcription': transcript})

@app.route('/summarize', methods=['POST'])
@cross_origin()
def summarize_text():
    transcription = request.json.get('text', '')
    api_key = "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"
    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4-turbo-preview",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that summarizes Vietnamese meeting transcriptions."},
            {"role": "user", "content": f"Tóm tắt đoạn ghi âm cuộc họp sau thành biên bản tóm tắt cuộc họp 300 từ:\n\n{transcription}"}
        ],
        temperature=0.7,
    )
    summary = response.choices[0].message.content.strip()

    return jsonify({'summary': summary})
if __name__ == '__main__':
    app.run(debug=True, port=5000)