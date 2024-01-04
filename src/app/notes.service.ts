import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { AuthService } from "@auth0/auth0-angular";
import { NgToastService } from "ng-angular-popup";
import { BehaviorSubject, of } from "rxjs";
import { AWS_URI } from "secrets";


@Injectable({
    providedIn: 'root'
})
export class NotesService {

    constructor(private auth: AuthService, public http: HttpClient, private toast: NgToastService) {
        this.auth.user$.subscribe({
            next: (newUser) => {
            this.userId = newUser?.sub;
            this.loadNotes();
            this.loadRetrieveNotes();
        }});
        this.auth.isAuthenticated$.subscribe({
            next: (newValue) => {
            this.isAuthenticated = newValue;
            if (newValue == true) {
                this.selectionShowing = true;
            } else {
                this.selectionShowing = false;
                this.deleteAllNotes();
            }
        }});
    }

    // private source of truth for the notes 
    private readonly _notesSource = new BehaviorSubject<Map<string, Note>>(new Map<string, Note>());
    private readonly _currentNoteIdSource = new BehaviorSubject<string | null>(null);
    private readonly _currentNoteSource = new BehaviorSubject<Note | null>(null);

    // exposed observables for reading
    readonly notes$ = this._notesSource.asObservable();
    readonly currentNoteId$ = this._currentNoteIdSource.asObservable();
    readonly currentNote$ = this._currentNoteSource.asObservable();

    // Note selection toggling
    selectionShowing: boolean = false;

    // Editing or Retrieving mode
    noteSelectionMode: string = "Edit";
    private readonly _retrieveNotesSource = new BehaviorSubject<Map<string, Note>>(new Map<string, Note>());
    readonly retrieveNotes$ = this._retrieveNotesSource.asObservable();

    userId: string | undefined = "";

    isAuthenticated: boolean;




    // Toggle selection menu viewing
    changeSelectionToggle() {
        this.selectionShowing = !this.selectionShowing;
    }

    // Toggle edit / retrieve mode
    changeEditRetrieveToggle(newToggle: string) {
        this.noteSelectionMode = newToggle;
        this._currentNoteIdSource.next(null);
        this._currentNoteSource.next(null);
    }

    // --- Current Note ---
    // Update & Read for the current note id
    updateCurrentNoteId(newId: string | null, isEditable: boolean) {
        if (newId == null) {
            this._currentNoteIdSource.next(null);
            this._currentNoteSource.next(null);
            return;
        }
        this._currentNoteIdSource.next(newId);
        if (isEditable) {
            var newCurrentNote = this._notesSource.getValue().get(newId);
        } else {
            var newCurrentNote = this._retrieveNotesSource.getValue().get(newId);
        }
        if (newCurrentNote) {
            this._currentNoteSource.next(newCurrentNote);
        }
    }

    getCurrentNoteId(): string | null {
        return this._currentNoteIdSource.getValue();
    }

    // --- Notes ----
    // Read, add, delete for the user's notes
    addNote() {

        this.http.post<NoteDto>(
            encodeURI(AWS_URI),
            { title: "Untitled", data: "", dateCreated: new Date().toISOString(), readOnly: false, ownerId: this.userId }
        ).subscribe({
            next: (response) => {
                var updatedNotes = new Map<string, Note>(this._notesSource.getValue());
                updatedNotes.set(response.noteId, this.toNote(response));
                this._notesSource.next(updatedNotes);
                this.updateCurrentNoteId(response.noteId, true);
            }, 
            error: (error) => {
                this.showError("Note unable to be added");
            }
        });
    }

    getNotes(): Note[] {
        return [...this._notesSource.getValue().values()];
    }

    getCurrentNote(): Note | null {
        var key;
        if (this._currentNoteIdSource.getValue() != null) {
            key = this._currentNoteIdSource.getValue()!;
            var note = this._notesSource.getValue().get(key);
            if (note) {
                return note;
            }
        }
        return null;
    }

    deleteCurrentNote() {
        this.http.delete(
            encodeURI(`${AWS_URI}${this.getCurrentNoteId()}`)
        ).subscribe({
            next: (response) => {
                var updatedNotes = this._notesSource.getValue();
                var key: string;
                if (this.getCurrentNoteId() != null) {
                    key = this._currentNoteIdSource.getValue()!;
                    updatedNotes.delete(key);
                    this._notesSource.next(updatedNotes);
                    this.loadRetrieveNotes();
                    this.selectTopNote();
                    this.showSuccess("Note successfully deleted");

                }
            }, 
            error: (error) => {
                this.showError("Note unable to be deleted");
            }
        });

    }

    selectTopNote() {
        // Get the sorted list of notes
        // call newId func on the top
        var sortedNotes = [...this.getNotes()].sort((a: Note, b: Note) => {
            if (a.dateCreated.getTime() < b.dateCreated.getTime()) {
                return 1;
            } else if (a.dateCreated.getTime() > b.dateCreated.getTime()) {
                return -1;
            } else {
                return 0;
            }
        });

        if (sortedNotes.length > 0) {
            var id = sortedNotes.at(0)?.noteId;
            if (id) {
                this.updateCurrentNoteId(id, true);
            }
        } else {
            console.log("Updating the sources to null");
            this._currentNoteIdSource.next(null);
            this._currentNoteSource.next(null);
        }

    }

    deleteAllNotes() {
        this._notesSource.next(new Map<string, Note>());
    }

    updateCurrentNoteData(newData: string) {
        var updatedNotes = new Map(this._notesSource.getValue());
        var currentNote = this.getCurrentNote();
        if (currentNote) {
            currentNote.data = newData;
            updatedNotes.set(currentNote.noteId, currentNote);
            this._notesSource.next(updatedNotes);
            this._currentNoteSource.next(currentNote);
        }
    }

    updateNoteData(noteId: string, newData: string | undefined) {
        if (newData == undefined) return;
        var updatedNotes = new Map(this._notesSource.getValue());
        var noteToEdit = this._notesSource.getValue().get(noteId);
        if (noteToEdit) {
            noteToEdit.data = newData;
            updatedNotes.set(noteId, noteToEdit);
            this._notesSource.next(updatedNotes);
        } 
    }

    updateCurrentNoteTitle(newTitle: string) {
        var updatedNotes = new Map(this._notesSource.getValue());
        var currentNote = this.getCurrentNote();
        if (currentNote) {
            currentNote.title = newTitle;
            updatedNotes.set(currentNote.noteId, currentNote);
            this._notesSource.next(updatedNotes);
            this._currentNoteSource.next(currentNote);
        }
    }

    updateCurrentNoteIsPersisted(newIsPersisted: boolean) {
        var updatedNotes = new Map(this._notesSource.getValue());
        var currentNote = this.getCurrentNote();
        if (currentNote) {
            currentNote.isPersisted = newIsPersisted;
            updatedNotes.set(currentNote.noteId, currentNote);
            this._notesSource.next(updatedNotes);
            this._currentNoteSource.next(currentNote);
        }
    }

    // Interacting with backend
    loadNotes() {
        if (!this.isAuthenticated) return

        this.http.get<NoteDto[]>(
            encodeURI(`${AWS_URI}${this.userId}`)
        ).subscribe({
            next: (response) => {
                var noteStore: Map<string, Note> = new Map<string, Note>();
                for (const note of response) {
                    // TODO: some sort of validation
                    note.isPersisted = true;
                    noteStore.set(note.noteId, this.toNote(note));
                }
                this._notesSource.next(noteStore);
            }, 
            error: (error) => {
                this.showError("Notes unable to be loaded");
            }
        });

    }

    loadRetrieveNotes() {
        if (!this.isAuthenticated) return;
        this.http.get<NoteDto[]>(
            encodeURI(`${AWS_URI}retrieve/${this.userId}`)
        ).subscribe({
            next: (response) => {
                var noteStore: Map<string, Note> = new Map<string, Note>();
                for (const note of response) {
                    // TODO: some sort of validation
                    note.isPersisted = true;
                    noteStore.set(note.noteId, this.toNote(note));
                }
                this._retrieveNotesSource.next(noteStore);
            }, 
            error: (error) => {
                this.showError("Notes unable to be loaded");
            }
        });
    }

    persistNote() {

        this.http.put<NoteDto>(
            encodeURI(`${AWS_URI}${this.getCurrentNoteId}`),
            this.toNoteDto(this.getCurrentNote())
        ).subscribe({
            next: (response) => {
                this.updateCurrentNoteIsPersisted(true);
                this.loadRetrieveNotes();
                this.showSuccess("Your note was successfully persisted");
            }, 
            error: (error) => {
                this.showError("Note unable to be persisted");
            }
        });
    }

    login() {
        if (!this.isAuthenticated) {
            this.auth.loginWithPopup();
        }
    }

    logout() {
        if (this.isAuthenticated) {
            this.auth.logout();
        }
    }


    toNote(noteDto: NoteDto): Note {
        return {
            title: noteDto.title,
            data: noteDto.data,
            noteId: noteDto.noteId,
            dateCreated: new Date(noteDto.dateCreated),
            readOnly: noteDto.readOnly,
            ownerId: noteDto.ownerId,
            isPersisted: noteDto.isPersisted
        }
    }

    toNoteDto(note: Note | null) {
        return {
            title: note?.title,
            data: note?.data,
            noteId: note?.noteId,
            dateCreated: note?.dateCreated.toISOString(),
            readOnly: note?.readOnly,
            ownerId: note?.ownerId,
            isPersisted: note?.isPersisted
        }
    }




    // Toasty
    showSuccess(message: string) {
        this.toast.success({ detail: "SUCCESS", summary: message, duration: 5000, position: "bottomRight" });
    }

    showError(message: string) {
        this.toast.error({ detail: "ERROR", summary: message, duration: 5000, position: "bottomRight" });
    }


}

export interface Note {
    title: string
    data: string,
    noteId: string,
    dateCreated: Date,
    readOnly: boolean,
    ownerId: string,
    isPersisted: boolean
}

export interface NoteDto {
    title: string
    data: string,
    noteId: string,
    dateCreated: string,
    readOnly: boolean,
    ownerId: string,
    isPersisted: boolean
}
