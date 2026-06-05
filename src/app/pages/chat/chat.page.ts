import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonSelect, IonList, IonItem, IonSelectOption } from "@ionic/angular/standalone";
import { LmStudioService } from 'src/app/core/services/lm-studio';
import { LmStudioModel } from 'src/app/core/models/lmstudio.model';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonSelect,
    IonList,
    IonItem,
    IonSelectOption
  ],
})
export class ChatPage implements OnInit {
  private lmStudioService = inject(LmStudioService);
  models: LmStudioModel[] = [];
  selectedModelKey: string | undefined;

  ngOnInit(): void {
    this.loadModels();
  }

  loadModels() {
    this.lmStudioService.getModels().subscribe({
      next: (res) => {
        console.log(res);
        this.models = res.models;
        this.selectedModelKey = res.models[0].key;
      },
      error: (err) => console.error(err),
    })
  }

}
