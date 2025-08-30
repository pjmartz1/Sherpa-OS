import { promises as fs } from 'fs';
import * as path from 'path';
import { getSherpaDir, ensureDir, writeJson, readJson, fileExists, writeMarkdown } from './fs.js';
import { formatDate, generateTicketId } from './ids.js';

export interface SessionState {
  id: string;
  startTime: string;
  lastUpdated: string;
  currentTicket?: string;
  currentTask?: string;
  workingFiles: string[];
  decisions: SessionDecision[];
  blockers: SessionBlocker[];
  progress: SessionProgress[];
  aiInteractions: AIInteraction[];
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}

export interface SessionDecision {
  id: string;
  timestamp: string;
  decision: string;
  rationale: string;
  impact: string[];
  reversible: boolean;
}

export interface SessionBlocker {
  id: string;
  timestamp: string;
  description: string;
  category: 'technical' | 'requirements' | 'dependency' | 'knowledge';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'workaround';
  resolution?: string;
}

export interface SessionProgress {
  timestamp: string;
  milestone: string;
  description: string;
  filesChanged: string[];
  testStatus: 'none' | 'partial' | 'complete' | 'failing';
}

export interface AIInteraction {
  id: string;
  timestamp: string;
  prompt: string;
  response: string;
  outcome: 'success' | 'failure' | 'partial';
  feedback: string;
  promptTemplate?: string;
  model?: string;
}

export interface HandoffContext {
  sessionId: string;
  timestamp: string;
  summary: string;
  currentState: string;
  nextActions: string[];
  relevantFiles: string[];
  contextMap: string;
  troubleshootingNotes: string[];
  aiPromptHistory: string[];
}

export class SessionManager {
  private sessionsDir: string;
  private handoffsDir: string;
  private currentSessionPath: string;

  constructor() {
    this.sessionsDir = path.join(getSherpaDir(), 'sessions');
    this.handoffsDir = path.join(this.sessionsDir, 'handoffs');
    this.currentSessionPath = path.join(this.sessionsDir, 'current.json');
  }

  async initializeSession(ticketId?: string, task?: string): Promise<SessionState> {
    await ensureDir(this.sessionsDir);
    await ensureDir(this.handoffsDir);

    const sessionId = `session-${Date.now()}`;
    const session: SessionState = {
      id: sessionId,
      startTime: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      currentTicket: ticketId,
      currentTask: task,
      workingFiles: [],
      decisions: [],
      blockers: [],
      progress: [],
      aiInteractions: [],
      status: 'active'
    };

    await writeJson(this.currentSessionPath, session);
    await this.saveSessionHistory(session);

    return session;
  }

  async getCurrentSession(): Promise<SessionState | null> {
    if (await fileExists(this.currentSessionPath)) {
      return await readJson<SessionState>(this.currentSessionPath);
    }
    return null;
  }

  async updateSession(updates: Partial<SessionState>): Promise<SessionState> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error('No active session found. Start a session first.');
    }

    const updated: SessionState = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    await writeJson(this.currentSessionPath, updated);
    await this.saveSessionHistory(updated);

    return updated;
  }

  async logDecision(decision: string, rationale: string, impact: string[] = [], reversible: boolean = true): Promise<void> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error('No active session found.');
    }

    const newDecision: SessionDecision = {
      id: generateTicketId(),
      timestamp: new Date().toISOString(),
      decision,
      rationale,
      impact,
      reversible
    };

    current.decisions.push(newDecision);
    await this.updateSession({ decisions: current.decisions });
  }

  async logBlocker(description: string, category: SessionBlocker['category'], severity: SessionBlocker['severity']): Promise<void> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error('No active session found.');
    }

    const newBlocker: SessionBlocker = {
      id: generateTicketId(),
      timestamp: new Date().toISOString(),
      description,
      category,
      severity,
      status: 'open'
    };

    current.blockers.push(newBlocker);
    await this.updateSession({ blockers: current.blockers });
  }

  async resolveBlocker(blockerId: string, resolution: string): Promise<void> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error('No active session found.');
    }

    const blocker = current.blockers.find(b => b.id === blockerId);
    if (blocker) {
      blocker.status = 'resolved';
      blocker.resolution = resolution;
      await this.updateSession({ blockers: current.blockers });
    }
  }

  async logProgress(milestone: string, description: string, filesChanged: string[], testStatus: SessionProgress['testStatus']): Promise<void> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error('No active session found.');
    }

    const newProgress: SessionProgress = {
      timestamp: new Date().toISOString(),
      milestone,
      description,
      filesChanged,
      testStatus
    };

    current.progress.push(newProgress);
    
    // Update working files
    const allFiles = new Set([...current.workingFiles, ...filesChanged]);
    current.workingFiles = Array.from(allFiles);

    await this.updateSession({ 
      progress: current.progress,
      workingFiles: current.workingFiles
    });
  }

  async logAIInteraction(prompt: string, response: string, outcome: AIInteraction['outcome'], feedback: string = '', promptTemplate?: string, model?: string): Promise<void> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error('No active session found.');
    }

    const interaction: AIInteraction = {
      id: generateTicketId(),
      timestamp: new Date().toISOString(),
      prompt,
      response,
      outcome,
      feedback,
      promptTemplate,
      model
    };

    current.aiInteractions.push(interaction);
    await this.updateSession({ aiInteractions: current.aiInteractions });
  }

  async prepareHandoff(): Promise<HandoffContext> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error('No active session found.');
    }

    const summary = this.generateSessionSummary(current);
    const currentState = this.getCurrentState(current);
    const nextActions = this.getNextActions(current);
    const contextMap = await this.generateContextMap(current);
    const troubleshootingNotes = await this.getTroubleshootingNotes(current);
    const aiPromptHistory = await this.getAIPromptHistory(current);

    const handoff: HandoffContext = {
      sessionId: current.id,
      timestamp: new Date().toISOString(),
      summary,
      currentState,
      nextActions,
      relevantFiles: current.workingFiles,
      contextMap,
      troubleshootingNotes,
      aiPromptHistory
    };

    const handoffPath = path.join(this.handoffsDir, `${current.id}-${formatDate()}.json`);
    await writeJson(handoffPath, handoff);

    // Generate human-readable handoff document
    const handoffDoc = await this.generateHandoffDocument(handoff);
    const docPath = path.join(this.handoffsDir, `${current.id}-${formatDate()}.md`);
    await writeMarkdown(docPath, handoffDoc);

    return handoff;
  }

  async resumeFromHandoff(handoffId: string): Promise<SessionState> {
    const handoffPath = path.join(this.handoffsDir, `${handoffId}.json`);
    
    if (!await fileExists(handoffPath)) {
      throw new Error(`Handoff ${handoffId} not found.`);
    }

    const handoff = await readJson<HandoffContext>(handoffPath);
    
    // Create new session with handoff context
    const session = await this.initializeSession();
    session.currentTask = handoff.summary;
    session.workingFiles = handoff.relevantFiles;

    // Add handoff information as a progress entry
    await this.logProgress(
      'Session Resumed',
      `Resumed from handoff: ${handoff.summary}`,
      handoff.relevantFiles,
      'none'
    );

    return session;
  }

  async completeSession(summary: string = ''): Promise<void> {
    const current = await this.getCurrentSession();
    if (!current) {
      throw new Error('No active session found.');
    }

    current.status = 'completed';
    
    if (summary) {
      await this.logProgress('Session Complete', summary, [], 'complete');
    }

    await this.updateSession({ status: 'completed' });
    
    // Clear current session
    if (await fileExists(this.currentSessionPath)) {
      await fs.unlink(this.currentSessionPath);
    }
  }

  private generateSessionSummary(session: SessionState): string {
    const duration = new Date().getTime() - new Date(session.startTime).getTime();
    const hours = Math.round(duration / (1000 * 60 * 60) * 10) / 10;
    
    return `Working on: ${session.currentTask || session.currentTicket || 'General development'}. ` +
           `Duration: ${hours}h. ` +
           `Progress: ${session.progress.length} milestones, ${session.decisions.length} decisions, ${session.blockers.filter(b => b.status === 'open').length} open blockers.`;
  }

  private getCurrentState(session: SessionState): string {
    const openBlockers = session.blockers.filter(b => b.status === 'open');
    const recentProgress = session.progress.slice(-3);
    
    let state = `Current files: ${session.workingFiles.join(', ')}. `;
    
    if (recentProgress.length > 0) {
      state += `Recent progress: ${recentProgress.map(p => p.milestone).join(', ')}. `;
    }
    
    if (openBlockers.length > 0) {
      state += `Open blockers: ${openBlockers.map(b => b.description).join(', ')}. `;
    }
    
    return state;
  }

  private getNextActions(session: SessionState): string[] {
    const actions: string[] = [];
    
    // Actions based on blockers
    session.blockers
      .filter(b => b.status === 'open')
      .forEach(b => actions.push(`Resolve blocker: ${b.description}`));
    
    // Actions based on test status
    const recentProgress = session.progress.slice(-1)[0];
    if (recentProgress?.testStatus === 'failing') {
      actions.push('Fix failing tests');
    } else if (recentProgress?.testStatus === 'none') {
      actions.push('Add tests for recent changes');
    }
    
    // Default actions if none specific
    if (actions.length === 0) {
      actions.push('Continue with current task');
      actions.push('Run tests');
      actions.push('Update documentation');
    }
    
    return actions.slice(0, 5); // Limit to top 5 actions
  }

  private async generateContextMap(session: SessionState): Promise<string> {
    // Generate a map of what's been done and current context
    let contextMap = `# Session Context Map\n\n`;
    
    if (session.currentTicket) {
      contextMap += `## Current Ticket: ${session.currentTicket}\n`;
    }
    
    if (session.currentTask) {
      contextMap += `## Current Task: ${session.currentTask}\n\n`;
    }
    
    contextMap += `## Key Decisions:\n`;
    session.decisions.slice(-5).forEach(d => {
      contextMap += `- ${d.decision} (${d.rationale})\n`;
    });
    
    contextMap += `\n## Recent Progress:\n`;
    session.progress.slice(-5).forEach(p => {
      contextMap += `- ${p.milestone}: ${p.description}\n`;
    });
    
    return contextMap;
  }

  private async getTroubleshootingNotes(session: SessionState): Promise<string[]> {
    const notes: string[] = [];
    
    // Add resolved blockers as troubleshooting notes
    session.blockers
      .filter(b => b.status === 'resolved' && b.resolution)
      .forEach(b => notes.push(`${b.description} → ${b.resolution}`));
    
    // Add failed AI interactions as lessons learned
    session.aiInteractions
      .filter(ai => ai.outcome === 'failure' && ai.feedback)
      .forEach(ai => notes.push(`AI failure: ${ai.feedback}`));
    
    return notes;
  }

  private async getAIPromptHistory(session: SessionState): Promise<string[]> {
    return session.aiInteractions
      .filter(ai => ai.outcome === 'success')
      .slice(-5) // Last 5 successful prompts
      .map(ai => `${ai.promptTemplate || 'Custom'}: ${ai.prompt.substring(0, 100)}...`);
  }

  private async generateHandoffDocument(handoff: HandoffContext): Promise<string> {
    return `# Session Handoff
*Session: ${handoff.sessionId}*
*Generated: ${handoff.timestamp}*

## Summary
${handoff.summary}

## Current State
${handoff.currentState}

## Next Actions
${handoff.nextActions.map(action => `- ${action}`).join('\n')}

## Working Files
${handoff.relevantFiles.map(file => `- ${file}`).join('\n')}

## Context Map
${handoff.contextMap}

## Troubleshooting Notes
${handoff.troubleshootingNotes.map(note => `- ${note}`).join('\n')}

## Successful AI Prompts
${handoff.aiPromptHistory.map(prompt => `- ${prompt}`).join('\n')}

---
*Use this context when resuming work on this task.*`;
  }

  private async saveSessionHistory(session: SessionState): Promise<void> {
    const historyDir = path.join(this.sessionsDir, 'history');
    await ensureDir(historyDir);
    
    const historyPath = path.join(historyDir, `${session.id}.json`);
    await writeJson(historyPath, session);
  }
}