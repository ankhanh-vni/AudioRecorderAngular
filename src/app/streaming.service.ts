import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { bufferToWave } from './audio-helper';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class StreamingService {
  private chunks: any[] = [];
  private processingQueue: any[] = [];
  private mediaRecorder: any;
  private audioContext: AudioContext = new AudioContext({ sampleRate: 16000 });
  private audioBlobSubject = new Subject<Blob>();
  private transcript = new Subject<string>();
  private curFileName = '';

  transcript$ = this.transcript.asObservable();
  audioBlob$ = this.audioBlobSubject.asObservable();

  constructor(private http: HttpClient) {}

  async startRecording() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // await register(await connect());

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.mediaRecorder = new MediaRecorder(stream);
    const randomId = Math.floor(Math.random() * 1000);
    this.curFileName = `audio_${randomId}`;
    this.mediaRecorder.ondataavailable = (event: any) => {
      this.chunks.push(event.data);
      this.sendWebM(event.data);
    };
    this.mediaRecorder.start(5000);
  }

  async stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.onstop = async () => {
        const audioData = await new Blob(this.chunks).arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(audioData);
        console.log(audioBuffer);
        const wavBlob = bufferToWave(audioBuffer, audioBuffer.length);
        this.audioBlobSubject.next(wavBlob);
        this.chunks = [];
      };

      this.mediaRecorder.stop();
    }
  }

  async getTransript(blob: Blob) {
    const formData = new FormData();
    if (blob) {
      formData.append('file', blob, 'recorded_audio.webm');

      this.http
        .post('http://localhost:5000/upload', formData)
        .subscribe((response: any) => {
          this.transcript.next(response.transcription);
        });
    }
  }
  async sendWebM(blob: Blob) {
    const formData = new FormData();
    if (blob) {
      formData.append('file', blob, `${this.curFileName}`);
      formData.append('filename', `${this.curFileName}.webm`);

      this.http
        .post('http://localhost:5000/receive', formData)
        .subscribe((response: any) => {
          console.log(response);
          this.transcript.next(response.transcription);
        });
    }
  }
}
