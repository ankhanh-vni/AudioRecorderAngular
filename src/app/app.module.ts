import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule, Routes } from '@angular/router';
import { UploadComponent } from './upload/upload.component';
import { HomeComponent } from './home/home.component';
import { StreamingComponent } from './streaming/streaming.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'upload', component: UploadComponent },
  { path: 'streaming', component: StreamingComponent },
];

@NgModule({
  declarations: [AppComponent, UploadComponent, HomeComponent, StreamingComponent],
  imports: [BrowserModule, HttpClientModule, RouterModule.forRoot(routes)],
  providers: [HttpClient],
  bootstrap: [AppComponent],
})
export class AppModule {}
