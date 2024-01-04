import { Component, ElementRef, ViewChild } from '@angular/core';
import { Note, NotesService } from '../notes.service';
import { Subscription } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-editor',
    templateUrl: './editor.component.html',
    styleUrls: ['./editor.component.scss']
})
export class EditorComponent {

    subscription: Subscription;
    currentNote: Note | null = null;
    @ViewChild("editorText") editorText: ElementRef;

    detailsOpen: boolean = false;
    @ViewChild("titleInput") titleInput: ElementRef;

    data: string | undefined = "";

    isAuthenticated: boolean;

    constructor(public notesService: NotesService, public auth: AuthService) { }

    ngOnInit() {
        this.subscription = this.notesService.currentNote$.subscribe(newNote => {
            if (newNote == null) {
                console.log("new note is null");
                if (this.currentNote != null && this.editorText != null) {
                    const regexReset = new RegExp(/(<\/?span[^>]*>)|(<\/?font[^>]*>)/, "g");
                    var cleanData = this.editorText.nativeElement.innerHTML.replaceAll(regexReset, "");
                    this.notesService.updateNoteData(this.currentNote.noteId, cleanData); 
                }
                this.currentNote = null;
                return;
            }



            // handle a current note change (not just the data of the same note)
            if (newNote?.noteId != this.currentNote?.noteId) {
                // this is a new note click - make decision based on if there was already a note selected
                if (this.currentNote == null) {
                    this.data = newNote.data;
                    // this.highlightDeclarations();
                } else {
                    const regexReset = new RegExp(/(<\/?span[^>]*>)|(<\/?font[^>]*>)/, "g");
                    var cleanData = this.editorText.nativeElement.innerHTML.replaceAll(regexReset, "");
                    this.editorText.nativeElement.innerHTML = cleanData;
                    this.notesService.updateNoteData(this.currentNote.noteId, cleanData);

                    this.data = newNote.data;
                }
            } else {
                // this is a data change of the current note -> which should only happen because the isPersisted value changes
                this.data = newNote.data;
            }
            this.currentNote = newNote;
        });

        this.auth.isAuthenticated$.subscribe(newValue => this.isAuthenticated = newValue);
    }

    handleTitleChange(event: any) {
        event.preventDefault();
        this.notesService.updateCurrentNoteTitle(event.target?.value);
        this.notesService.updateCurrentNoteIsPersisted(false);
    }

    handleDetailsClick() {
        this.detailsOpen = !this.detailsOpen;
    }

    handleDeleteClick() {
        this.notesService.deleteCurrentNote();
    }

    handleSaveClick() {
        if (this.currentNote == null) return;
        const regexReset = new RegExp(/(<\/?span[^>]*>)|(<\/?font[^>]*>)/, "g");
        var cleanData = this.editorText.nativeElement.innerHTML.replaceAll(regexReset, "");
        this.editorText.nativeElement.innerHTML = cleanData;
        this.notesService.updateNoteData(this.currentNote.noteId, cleanData);
        this.notesService.persistNote();
    }

    handleLoginClick() {
        this.notesService.login();
    }

    handleSaveKeyEvent(event: any) {
        if (this.currentNote == null) return;
        const regexReset = new RegExp(/(<\/?span[^>]*>)|(<\/?font[^>]*>)/, "g");
        var cleanData = this.editorText.nativeElement.innerHTML.replaceAll(regexReset, "");
        this.editorText.nativeElement.innerHTML = cleanData;
        this.notesService.updateNoteData(this.currentNote.noteId, cleanData);
        this.notesService.persistNote();
    }



    handleEditorFocus() {
        const regexReset = new RegExp(/(<\/?span[^>]*>)|(<\/?font[^>]*>)/, "g");
        var cleanData = this.editorText.nativeElement.innerHTML.replaceAll(regexReset, "");
        this.editorText.nativeElement.innerHTML = cleanData;
    }

    handleEditorUnfocus() {
        const regexReset = new RegExp(/(<\/?span[^>]*>)|(<\/?font[^>]*>)/, "g");
        var cleanData = this.editorText.nativeElement.innerHTML.replaceAll(regexReset, "");
        var newData = cleanData.replaceAll(new RegExp(/@begin\(.*?\)|@end\(.*?\)/, "g"), `<span style="color:red">$&</span>`);
        var newerData = newData?.replaceAll(new RegExp(/(?!(@begin|@end))@\w+/, "g"), `<span style="color:green">$&</span>`);
        this.editorText.nativeElement.innerHTML = newerData;
    }

    handleEditorClick() {
        if (this.editorText && this.currentNote) {
            if (this.currentNote.readOnly) {
                this.editorText.nativeElement.setAttribute("contenteditable", "false");
                this.editorText.nativeElement.blur();
                this.handleEditorUnfocus();
            } else {
                this.editorText.nativeElement.setAttribute("contenteditable", "true");
                this.editorText.nativeElement.focus();
            }
        }
    }

    handleDataUpdate(event: any) {
        this.notesService.updateCurrentNoteIsPersisted(false);
    }


}

