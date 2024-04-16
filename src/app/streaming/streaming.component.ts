import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { StreamingService } from '../streaming.service';

@Component({
  selector: 'app-streaming',
  templateUrl: './streaming.component.html',
  styleUrls: ['./streaming.component.css'],
})
export class StreamingComponent implements OnInit {
  isRecording = false;
  audioURL: string | null = null;
  transcript = '';
  @ViewChild('audioPlayer') audioPlayer!: ElementRef<HTMLAudioElement>;
  audioBlob: Blob | null = null;
  transcriptFetched = false;
  summary = '';
  recordingStopped = false;

  constructor(
    private http: HttpClient,
    private streamingService: StreamingService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.streamingService.audioBlob$.subscribe((blob) => {
      this.audioBlob = blob;
      this.audioURL = window.URL.createObjectURL(blob);
      this.audioPlayer.nativeElement.src = this.audioURL;
      this.cd.detectChanges();
    });
    this.streamingService.transcript$.subscribe((transcript) => {
      this.transcript += transcript;
      this.transcriptFetched = true;
      this.cd.detectChanges();
    });
  }

  startRecording() {
    this.transcript = '';
    this.isRecording = true;
    this.recordingStopped = false;
    this.transcriptFetched = false;
    this.streamingService.startRecording();
  }

  stopRecording() {
    this.isRecording = false;
    this.recordingStopped = true;
    this.streamingService.stopRecording();
  }

  summarize() {
    this.http
      .post('http://localhost:5000/summarize', { text: this.transcript })
      .subscribe((response: any) => {
        this.transcript = response.summary;
        console.log(this.summary);
        this.cd.detectChanges();
      });
  }
}
