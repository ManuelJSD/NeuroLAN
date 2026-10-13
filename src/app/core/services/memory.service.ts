import { Injectable, inject } from '@angular/core';
import localforage from 'localforage';
import { BehaviorSubject } from 'rxjs';
import { Memory } from '../models/memory.model';
import { ChatMessage, MemoryActionRecord } from '../models/openai.model';
import { SettingsService } from './settings';

@Injectable({
  providedIn: 'root',
})
export class MemoryService {
  private readonly STORAGE_KEY = 'memories';
  /** Counts how many times extraction has been requested in this session. */
  private extractionCallCount = 0;
  /** Maximum characters per memory entry. */
  private readonly MAX_MEMORY_LENGTH = 200;

  private settingsService = inject(SettingsService);

  // Reactive stream: emits the list whenever it changes
  private memoriesSubject = new BehaviorSubject<Memory[]>([]);
  readonly memories$ = this.memoriesSubject.asObservable();

  constructor() {
    this.loadMemories().then((mems) => this.memoriesSubject.next(mems));
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  async loadMemories(): Promise<Memory[]> {
    const stored = await localforage.getItem<Memory[]>(this.STORAGE_KEY);
    return (stored ?? []).sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveMemory(memory: Memory): Promise<void> {
    const memories = await this.loadMemories();
    const index = memories.findIndex((m) => m.id === memory.id);

    if (index !== -1) {
      memories[index] = memory;
    } else {
      memories.push(memory);
    }

    await localforage.setItem(this.STORAGE_KEY, memories);
    this.memoriesSubject.next(memories.sort((a, b) => b.createdAt - a.createdAt));
  }

  async deleteMemory(id: string): Promise<void> {
    const memories = await this.loadMemories();
    const filtered = memories.filter((m) => m.id !== id);
    await localforage.setItem(this.STORAGE_KEY, filtered);
    this.memoriesSubject.next(filtered);
  }

  async deleteAllMemories(): Promise<void> {
    await localforage.removeItem(this.STORAGE_KEY);
    this.memoriesSubject.next([]);
  }

  async addMemory(content: string, source: 'auto' | 'user' = 'user'): Promise<Memory> {
    // Truncate to avoid overly long memories consuming too many tokens
    const truncated = content.trim().substring(0, this.MAX_MEMORY_LENGTH);
    const now = Date.now();
    const memory: Memory = {
      id: this.generateId(),
      content: truncated,
      source,
      createdAt: now,
      updatedAt: now,
    };
    await this.saveMemory(memory);

    // Enforce the memory limit (trim oldest entries)
    const limit = await this.settingsService.getMemoryLimit();
    if (limit > 0) {
      const all = await this.loadMemories(); // already sorted newest-first
      if (all.length > limit) {
        const toKeep = all.slice(0, limit);
        await localforage.setItem(this.STORAGE_KEY, toKeep);
        this.memoriesSubject.next(toKeep);
      }
    }

    return memory;
  }

  async updateMemory(id: string, content: string): Promise<void> {
    const memories = await this.loadMemories();
    const memory = memories.find((m) => m.id === id);
    if (memory) {
      memory.content = content.trim().substring(0, this.MAX_MEMORY_LENGTH);
      memory.updatedAt = Date.now();
      await this.saveMemory(memory);
    }
  }

  // ── System Prompt injection ───────────────────────────────────────────────

  /**
   * Builds a system message with all saved memories to prepend to each
   * conversation. Returns null if memories are disabled or there are none.
   */
  async buildMemorySystemMessage(): Promise<ChatMessage | null> {
    const enabled = await this.settingsService.getMemoryEnabled();
    if (!enabled) return null;

    const memories = await this.loadMemories();
    if (memories.length === 0) return null;

    // User-added memories first, then auto-extracted (sorted by recency within each group)
    const userMems = memories.filter((m) => m.source === 'user');
    const autoMems = memories.filter((m) => m.source === 'auto');
    const ordered = [...userMems, ...autoMems];

    const list = ordered.map((m) => `- ${m.content}`).join('\n');

    return {
      role: 'system',
      content:
        `[USER MEMORY — facts you remember about the user from previous conversations]\n` +
        list +
        `\n[END OF MEMORY]\n\n` +
        `Use this information naturally when relevant. Do not explicitly mention that you have a memory system unless asked.`,
    };
  }

  // ── Automatic extraction ──────────────────────────────────────────────────

  /**
   * Sends the conversation to the model and asks it to extract, update or
   * delete memories. Supports add / update / delete actions.
   *
   * This is a fire-and-forget operation: errors are silently swallowed so
   * a backend/LM Studio outage never breaks the chat flow.
   */
  async extractAndSaveMemories(
    messages: ChatMessage[],
    model: string,
    baseUrl: string,
  ): Promise<MemoryActionRecord[]> {
    const enabled = await this.settingsService.getMemoryEnabled();
    if (!enabled) return [];

    // ── Throttling: configurable from settings ────────────────────────────
    this.extractionCallCount++;
    const freq = Math.max(1, await this.settingsService.getMemoryExtractionFrequency());
    // Always extract on the very first turn so no data is lost at conversation start
    const isFirstTurn = this.extractionCallCount === 1;
    if (!isFirstTurn && this.extractionCallCount % freq !== 0) return [];

    // Only extract when there is at least one user + one assistant turn
    const hasUserMsg = messages.some((m) => m.role === 'user');
    const hasAssistantMsg = messages.some((m) => m.role === 'assistant');
    if (!hasUserMsg || !hasAssistantMsg) return [];

    // Build a compact transcript (skip tool/system messages)
    const transcript = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const existingMemories = await this.loadMemories();
    const existingList =
      existingMemories.length > 0
        ? existingMemories.map((m) => `- ${m.content}`).join('\n')
        : '(none)';

    const extractionPrompt: ChatMessage[] = [
      {
        role: 'system',
        content:
          'You are a memory extraction assistant. Read a conversation and decide what to remember about the USER.\n\n' +
          'You can ADD new facts, UPDATE outdated ones, or DELETE incorrect ones.\n\n' +
          'Rules:\n' +
          '1. Only extract facts explicitly stated by or about the user (name, preferences, job, projects, goals, language, etc.).\n' +
          '2. If a new fact CONTRADICTS or EXTENDS an existing memory, use "update" and set "replaces" to the EXACT text of the old memory.\n' +
          '3. If the user corrects something wrong, use "delete" to remove the incorrect memory.\n' +
          '4. Do NOT add facts already in the existing list unless updating them.\n' +
          '5. Output ONLY a JSON array of objects. Each object must have:\n' +
          '   - "action": "add" | "update" | "delete"\n' +
          '   - "content": "the new fact" (omit for delete)\n' +
          '   - "replaces": "exact text of old memory" (only for update/delete)\n' +
          '6. Examples:\n' +
          '   [{"action":"add","content":"Favorite color is blue"}]\n' +
          '   [{"action":"update","content":"Full name is Pepito Pérez","replaces":"Name is Pepito"}]\n' +
          '   [{"action":"delete","replaces":"Name is Pepito"}]\n' +
          '7. If nothing needs to change, output: []',
      },
      {
        role: 'user',
        content:
          `EXISTING MEMORIES (use exact text in "replaces" when updating/deleting):\n${existingList}\n\n` +
          `CONVERSATION:\n${transcript}\n\n` +
          `Return the JSON array of memory actions:`,
      },
    ];

    const appliedActions: MemoryActionRecord[] = [];

    try {
      const cleanUrl = this.getCleanUrl(baseUrl);
      const response = await fetch(`${cleanUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: extractionPrompt,
          temperature: 0.1,
          stream: false,
        }),
        // Short timeout: if the backend is down, we give up quickly
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) return [];

      const data = await response.json();
      const raw: string = data?.choices?.[0]?.message?.content ?? '';

      // Extract the JSON array from the response (model may add prose around it)
      const match = raw.match(/\[[\s\S]*\]/);
      if (!match) return [];

      const actions: unknown[] = JSON.parse(match[0]);
      if (!Array.isArray(actions)) return [];

      // Re-load for freshest state before applying changes
      const currentMemories = await this.loadMemories();

      for (const action of actions) {
        if (typeof action !== 'object' || action === null) continue;
        const a = action as { action?: string; content?: string; replaces?: string };

        if (a.action === 'add' && typeof a.content === 'string' && a.content.trim()) {
          // Skip if a very similar memory already exists
          if (!this.isSimilarToExisting(a.content.trim(), currentMemories)) {
            await this.addMemory(a.content.trim(), 'auto');
            appliedActions.push({ action: 'add', content: a.content.trim() });
          }
        } else if (
          a.action === 'update' &&
          typeof a.content === 'string' &&
          typeof a.replaces === 'string'
        ) {
          // Find the best-matching existing memory and update it in place
          const target = this.findBestMatch(a.replaces, currentMemories);
          if (target) {
            await this.updateMemory(target.id, a.content.trim());
            appliedActions.push({ action: 'update', content: a.content.trim() });
          } else {
            // No close match found — treat as a new addition
            await this.addMemory(a.content.trim(), 'auto');
            appliedActions.push({ action: 'add', content: a.content.trim() });
          }
        } else if (a.action === 'delete' && typeof a.replaces === 'string') {
          const target = this.findBestMatch(a.replaces, currentMemories);
          if (target) {
            await this.deleteMemory(target.id);
            appliedActions.push({ action: 'delete', content: target.content });
          }
        }
      }

      return appliedActions;
    } catch {
      // Silent failure — memory extraction is best-effort
      return [];
    }
  }

  // ── Deduplication & matching helpers ─────────────────────────────────────

  /**
   * Returns true if `candidate` is too similar to any existing memory.
   */
  private isSimilarToExisting(candidate: string, existing: Memory[]): boolean {
    return this.findBestMatch(candidate, existing) !== null;
  }

  /**
   * Finds the existing memory with the highest word-overlap score against `text`.
   * Uses the Jaccard index; returns null if no memory exceeds the 0.55 threshold.
   */
  private findBestMatch(text: string, existing: Memory[]): Memory | null {
    const wordsOf = (t: string): Set<string> =>
      new Set(
        t
          .toLowerCase()
          .replace(/[^a-z0-9áéíóúüñ\s]/gi, '')
          .split(/\s+/)
          .filter((w) => w.length > 2),
      );

    const candidateWords = wordsOf(text);
    if (candidateWords.size === 0) return null;

    let bestMemory: Memory | null = null;
    let bestScore = 0.55; // minimum Jaccard threshold

    for (const mem of existing) {
      const existingWords = wordsOf(mem.content);
      const intersection = [...candidateWords].filter((w) => existingWords.has(w));
      const union = new Set([...candidateWords, ...existingWords]);
      const jaccard = intersection.length / union.size;
      if (jaccard > bestScore) {
        bestScore = jaccard;
        bestMemory = mem;
      }
    }
    return bestMemory;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private getCleanUrl(baseUrl: string): string {
    let url = baseUrl.trim();
    if (url.endsWith('/')) url = url.slice(0, -1);
    if (!/^https?:\/\//i.test(url)) url = 'http://' + url;
    return url;
  }

  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
