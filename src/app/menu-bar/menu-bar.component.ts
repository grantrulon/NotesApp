import { outputAst } from '@angular/compiler';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { NotesService } from '../notes.service';
import { AuthService, User } from '@auth0/auth0-angular';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-menu-bar',
  templateUrl: './menu-bar.component.html',
  styleUrls: ['./menu-bar.component.scss']
})
export class MenuBarComponent {
    @ViewChild("menu") menu: ElementRef;

    loginValid: boolean = true;
    userEmail: string = "";
    userPassword: string = "";

    isAuthenticated: boolean;

    constructor(public notesService: NotesService, public auth: AuthService) {}

    ngOnInit() {
        this.auth.isAuthenticated$.subscribe(newValue => this.isAuthenticated = newValue);
    }

    handleSelectionToggleChange() {
        this.notesService.changeSelectionToggle();
    }

    handleAccountButtonClick() {
        this.notesService.login();
    }

    handleUserLogoutClick() {
        this.notesService.logout();
    }

}