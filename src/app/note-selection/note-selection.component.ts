import { Component, Optional } from '@angular/core';
import { Note, NotesService } from '../notes.service';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '@auth0/auth0-angular';


@Component({
  selector: 'app-note-selection',
  templateUrl: './note-selection.component.html',
  styleUrls: ['./note-selection.component.scss']
})
export class NoteSelectionComponent {

  notes: Note[] = [];
  retrievedNotes: Note[] = [];
  searchedNotes: Note[] = [];
  searchInputData: string = "";
  subscription: Subscription;

  isAuthenticated: boolean;

  constructor(public notesService: NotesService, public auth: AuthService) {}

  ngOnInit() {
    this.subscription = this.notesService.notes$.subscribe(newNotes => {
      this.notes = [...newNotes.values()].sort(this.noteSortHelper);
    });
    this.subscription = this.notesService.retrieveNotes$.subscribe(newNotes => {
      this.retrievedNotes = [...newNotes.values()].sort(this.noteSortHelper);
    });
    this.auth.isAuthenticated$.subscribe(newValue => this.isAuthenticated = newValue);
  }

  handleAddNote() {
    if(!this.isAuthenticated) return;
    this.notesService.addNote();
  }

  noteSortHelper(a: Note, b: Note): number {
    if (a.dateCreated.getTime() < b.dateCreated.getTime()) {
      return 1;
    } else if (a.dateCreated.getTime() > b.dateCreated.getTime()) {
      return -1;
    } else {
      return 0;
    }
  }

  handleSearchInput(event: any) {
    this.notesService.updateCurrentNoteId(null, true);
    if (event.target.value == "") {
      this.searchedNotes = [];
      return;
    } else {
      this.runSearch(event.target.value); 
    }
  }

  // Credit: https://levelup.gitconnected.com/implement-search-feature-on-a-web-page-in-plain-javascript-adad27e48
  runSearch(searchTerm: string) {
    var allNotes = this.notes.concat(this.retrievedNotes);
    var tokens = searchTerm.toLowerCase().split(' ')
                  .filter(function(token){
                    return token.trim() !== '';
                  });
    console.log(tokens);
    var searchTermRegex = new RegExp(tokens.join('|'), 'gim');
    var filteredNotes = allNotes.filter((note: Note) => {
      const noteString = note.title + " " + note.data + " " + note.dateCreated.toDateString();
      return noteString.match(searchTermRegex);
    });

    this.searchedNotes = filteredNotes;
    
    

  }

}