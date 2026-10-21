import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonChip,
  IonIcon,
  IonLabel,
  IonSelect,
  IonSelectOption,
  IonTextarea,
} from '@ionic/angular/standalone';
import { TranslatePipe } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  attachOutline,
  closeCircleOutline,
  hourglassOutline,
  refreshOutline,
} from 'ionicons/icons';
import {
  AttachedFile,
  FileAttachmentService,
} from 'src/app/core/services/file-attachment.service';

export interface ChatInputPayload {
  text: string;
  images: string[];
  files: AttachedFile[];
  model: string;
  temporaryChat?: boolean;
  searchThisMessage?: boolean;
}

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    TranslatePipe,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonChip,
    IonLabel,
  ],
})
export class ChatInputComponent {
  public fileAttachmentService = inject(FileAttachmentService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('fileInput') fileInputRef?: ElementRef<HTMLInputElement>;

  /** Available AI models */
  @Input() models: { id: string }[] = [];

  /** Currently selected model ID */
  @Input() selectedModelKey: string = '';

  /** Whether a message generation is actively running */
  @Input() isSending: boolean = false;

  /** Whether web search feature is enabled in settings */
  @Input() webSearchEnabled: boolean = false;

  /** Whether to show the temporary chat toggle button (e.g. on Home) */
  @Input() showTemporaryChat: boolean = false;

  /** Total conversation tokens count (shown as chip when > 0) */
  @Input() totalTokens: number = 0;

  /** Textarea placeholder i18n key or text */
  @Input() placeholder: string = 'CHAT.TYPE_MESSAGE';

  /** Send button title i18n key */
  @Input() sendButtonTitle: string = 'CHAT.SEND';

  /** Two-way bound text input */
  @Input() text: string = '';
  @Output() textChange = new EventEmitter<string>();

  /** Temporary chat state */
  @Input() temporaryChat: boolean = false;
  @Output() temporaryChatChange = new EventEmitter<boolean>();

  /** Emitted when the user submits a message */
  @Output() send = new EventEmitter<ChatInputPayload>();

  /** Emitted when the user clicks the stop button during generation */
  @Output() stop = new EventEmitter<void>();

  /** Emitted when the user picks a different model from the select */
  @Output() modelChange = new EventEmitter<string>();

  /** Emitted when the reload models button is clicked */
  @Output() reloadModels = new EventEmitter<void>();

  /** Emitted when an error occurs reading selected files */
  @Output() fileError = new EventEmitter<string>();

  attachedImages: string[] = [];
  attachedFiles: AttachedFile[] = [];
  searchThisMessage: boolean = false;

  constructor() {
    addIcons({
      refreshOutline,
      hourglassOutline,
      attachOutline,
      closeCircleOutline,
    });
  }

  onTextChange(value: string): void {
    this.text = value;
    this.textChange.emit(value);
  }

  onModelSelect(modelId: string): void {
    this.selectedModelKey = modelId;
    this.modelChange.emit(modelId);
  }

  toggleTemporaryChat(): void {
    this.temporaryChat = !this.temporaryChat;
    this.temporaryChatChange.emit(this.temporaryChat);
  }

  onEnterKey(event: KeyboardEvent): void {
    if (!event.shiftKey) {
      event.preventDefault();
      this.submitMessage();
    }
  }

  triggerAttachmentPicker(): void {
    this.fileInputRef?.nativeElement.click();
  }

  async onFilesSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    input.value = '';

    const imageFiles: File[] = [];
    const genericFiles: File[] = [];

    for (const file of files) {
      const isImg =
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(file.name);
      if (isImg) {
        imageFiles.push(file);
      } else {
        genericFiles.push(file);
      }
    }

    // Process image attachments
    for (const file of imageFiles) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        this.attachedImages = [...this.attachedImages, dataUrl];
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }

    // Process generic attachments (TXT, code, PDF)
    if (genericFiles.length > 0) {
      const { ok, errors } = await this.fileAttachmentService.readFiles(genericFiles);
      if (ok.length > 0) {
        this.attachedFiles = [...this.attachedFiles, ...ok];
        this.cdr.markForCheck();
      }
      if (errors && errors.length > 0) {
        this.fileError.emit(errors[0]);
      }
    }
  }

  removeImage(index: number): void {
    this.attachedImages = this.attachedImages.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  removeFile(index: number): void {
    this.attachedFiles = this.attachedFiles.filter((_, i) => i !== index);
    this.cdr.markForCheck();
  }

  submitMessage(): void {
    const trimmed = (this.text || '').trim();
    if (
      trimmed === '' &&
      this.attachedImages.length === 0 &&
      this.attachedFiles.length === 0
    ) {
      return;
    }
    if (this.isSending) {
      return;
    }

    this.send.emit({
      text: trimmed,
      images: [...this.attachedImages],
      files: [...this.attachedFiles],
      model: this.selectedModelKey,
      temporaryChat: this.temporaryChat,
      searchThisMessage: this.searchThisMessage,
    });

    this.text = '';
    this.textChange.emit('');
    this.attachedImages = [];
    this.attachedFiles = [];
    this.searchThisMessage = false;
    this.cdr.markForCheck();
  }

  clear(): void {
    this.text = '';
    this.textChange.emit('');
    this.attachedImages = [];
    this.attachedFiles = [];
    this.searchThisMessage = false;
    this.cdr.markForCheck();
  }
}
