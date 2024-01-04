import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Note, NotesService } from '../../notes.service';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-note',
  templateUrl: './note.component.html',
  styleUrls: ['./note.component.scss']
})
export class NoteComponent {

    @Input() data: Note;
    currentNoteId: string | null;
    subscription: Subscription;

    constructor(public notesService: NotesService) {}

    ngOnInit() {
        this.subscription = this.notesService.currentNoteId$.subscribe(newId => {
            this.currentNoteId = newId;
        });
    }

    onNoteClick() {
        this.notesService.updateCurrentNoteId(this.data.noteId, !this.data.readOnly);
    }

}