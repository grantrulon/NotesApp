import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MenuBarComponent } from './menu-bar/menu-bar.component';

import { ScrollingModule } from '@angular/cdk/scrolling';
import { NoteSelectionComponent } from './note-selection/note-selection.component';
import { MatInputModule } from '@angular/material/input';
import { EditorComponent } from './editor/editor.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { NoteComponent } from './note-selection/note/note.component';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthModule, AuthService } from '@auth0/auth0-angular';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthHttpInterceptor } from '@auth0/auth0-angular';
import { NgToastModule } from 'ng-angular-popup';
import {TranslateModule} from '@ngx-translate/core';
import { AUDIENCE_URL } from 'secrets';








@NgModule({
  declarations: [
    AppComponent,
    MenuBarComponent,
    NoteSelectionComponent,
    EditorComponent,
    NoteComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ScrollingModule,
    MatInputModule,
    MatIconModule,
    MatButtonToggleModule,
    MatCardModule,
    FormsModule,
    MatFormFieldModule,
    MatMenuModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatTooltipModule,
    HttpClientModule,
    NgToastModule,
    TranslateModule,
    AuthModule.forRoot({
      domain: 'dev-podjc85ljplnotpw.us.auth0.com',
      clientId: 'E0XXULljQFQcFs07VUnFYcfZMTpMzhO4',

      authorizationParams: {
        redirect_uri: window.location.origin,

        // Request this audience at user authentication time
        audience: `${AUDIENCE_URL}/`,

        // Request this scope at user authentication time
        // scope: 'read:current_user',
      },

      // Specify configuration for the interceptor              
      httpInterceptor: {
        allowedList: [
          {
            // Match any request that starts 'https://dev-podjc85ljplnotpw.us.auth0.com/api/v2/' (note the asterisk)
            uri: `${AUDIENCE_URL}/*`,
            tokenOptions: {
              authorizationParams: {
                // The attached token should target this audience
                audience: `${AUDIENCE_URL}/`,

                // The attached token should have these scopes
                scope: 'read:current_user'
              }
            }
          }
        ]
      }
    })
  ],
  providers: [
    AuthService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthHttpInterceptor, multi: true },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
