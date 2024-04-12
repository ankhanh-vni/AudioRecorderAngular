import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { AudioRecordingService } from '../audio-recording.service';

@Component({
  selector: 'app-streaming',
  templateUrl: './streaming.component.html',
  styleUrls: ['./streaming.component.css']
})
export class StreamingComponent implements OnInit {
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

}
