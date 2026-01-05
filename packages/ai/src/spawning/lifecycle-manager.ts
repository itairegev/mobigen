/**
 * Lifecycle Manager - Manages agent lifecycle events and state transitions
 */

import type {
  AgentInstance, AgentState, AgentLifecycleEvent, AgentLifecycleEventData, LifecycleEventListener
} from './types.js';

const VALID_TRANSITIONS: Record<AgentState, AgentState[]> = {
  idle: ['starting', 'stopping', 'running'],
  starting: ['running', 'error', 'stopping'],
  running: ['paused', 'stopping', 'error', 'idle'],
  paused: ['running', 'stopping', 'error'],
  stopping: ['stopped'],
  stopped: ['starting'],
  error: ['stopping', 'starting'],
};

export class LifecycleManager {
  private listeners: Map<AgentLifecycleEvent | '*', LifecycleEventListener[]> = new Map();
  private eventHistory: AgentLifecycleEventData[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  canTransition(from: AgentState, to: AgentState): boolean {
    return VALID_TRANSITIONS[from]?.includes(to) ?? false;
  }

  transition(agent: AgentInstance, newState: AgentState): boolean {
    if (!this.canTransition(agent.state, newState)) {
      console.warn(`Invalid state transition: ${agent.state} -> ${newState}`);
      return false;
    }

    const oldState = agent.state;
    agent.state = newState;

    const event = this.stateToEvent(newState);
    if (event) this.emit(event, agent, undefined, undefined, { oldState, newState });

    return true;
  }

  private stateToEvent(state: AgentState): AgentLifecycleEvent | null {
    const map: Partial<Record<AgentState, AgentLifecycleEvent>> = {
      starting: 'started',
      stopped: 'stopped',
      paused: 'paused',
      running: 'resumed',
      error: 'error',
    };
    return map[state] || null;
  }

  on(event: AgentLifecycleEvent | '*', listener: LifecycleEventListener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(listener);
    return () => this.off(event, listener);
  }

  off(event: AgentLifecycleEvent | '*', listener: LifecycleEventListener): void {
    const list = this.listeners.get(event);
    if (list) {
      const idx = list.indexOf(listener);
      if (idx >= 0) list.splice(idx, 1);
    }
  }

  emit(
    event: AgentLifecycleEvent,
    agent: AgentInstance,
    taskId?: string,
    error?: Error,
    data?: unknown
  ): void {
    const eventData: AgentLifecycleEventData = {
      event,
      agentId: agent.id,
      role: agent.role,
      timestamp: new Date(),
      taskId,
      error,
      data,
    };

    this.eventHistory.push(eventData);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Notify specific listeners
    this.listeners.get(event)?.forEach(l => l(eventData));
    // Notify wildcard listeners
    this.listeners.get('*')?.forEach(l => l(eventData));
  }

  getHistory(agentId?: string, limit = 100): AgentLifecycleEventData[] {
    let history = this.eventHistory;
    if (agentId) history = history.filter(e => e.agentId === agentId);
    return history.slice(-limit);
  }

  clearHistory(): void {
    this.eventHistory = [];
  }

  getAgentTimeline(agentId: string): AgentLifecycleEventData[] {
    return this.eventHistory.filter(e => e.agentId === agentId);
  }
}

export const lifecycleManager = new LifecycleManager();
