import { ChangeDetectorRef, Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.css'],
})
export class UploadComponent {
  selectedFile!: File;
  transcript = '';
  transcriptFetched = false;
  fileUploaded = false;


  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }
  constructor(private http: HttpClient, private cd: ChangeDetectorRef) {}

  uploadAudio() {
    this.fileUploaded = true;
    this.transcript = 'Waiting for transcript';
    this.cd.detectChanges();
    const formData = new FormData();
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);

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
  summarizeAgain() {
    this.http
      .post('http://localhost:5000/summarize', { text: this.transcript })
      .subscribe((response: any) => {
        this.transcript = response.summary;
        console.log(this.transcript);
        this.cd.detectChanges();
      });
  }
}
