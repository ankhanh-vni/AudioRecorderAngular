import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AudioRecordingService } from '../audio-recording.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isRecording = false;
  audioURL: string | null = null;
  transcript = '';
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  audioBlob: Blob | null = null;
  transcriptFetched = false;
  summary = ''
  recordingStopped = false;

  constructor(
    private http: HttpClient,
    private audioRecordingService: AudioRecordingService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.audioRecordingService.audioBlob$.subscribe((blob) => {
      this.audioBlob = blob;
      this.audioURL = window.URL.createObjectURL(blob);
      this.audioPlayer.nativeElement.src = this.audioURL;
      this.cd.detectChanges();
    });
  }

  startRecording() {
    this.isRecording = true;
    this.recordingStopped = false;
    this.audioRecordingService.startRecording();
  }

  stopRecording() {
    this.isRecording = false;
    this.recordingStopped = true;
    this.audioRecordingService.stopRecording();

  }
  uploadAudio() {
    this.transcript = 'Waiting for transcript';
    this.cd.detectChanges();
    const formData = new FormData();
    if (this.audioBlob) {
      formData.append('file', this.audioBlob, 'recorded_audio.wav');

      this.http
        .post('http://localhost:5000/upload', formData)
        .subscribe((response: any) => {
          this.transcript = response.transcription;
          console.log(this.transcript);
          this.transcriptFetched = true;
          this.cd.detectChanges();
        });
    }
  }

  summarize() {

    this.http
      .post('http://localhost:5000/summarize', { text: this.transcript })
      .subscribe((response: any) => {
        this.transcript = response.summary;
        console.log(this.transcript);
        this.cd.detectChanges();
      });
  }
}
