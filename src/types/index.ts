export interface Ticket {
  ticket_id: string;
  title: string;
  outcome: string;
  scope_in: string[];
  scope_out: string[];
  acceptance_criteria: string[];
  apidiff?: string[];
  dbdiff?: string[];
  ui_components?: string[];
  telemetry: {
    events: string[];
    alerts: string[];
  };
  test_plan: {
    unit: string[];
    e2e: string[];
  };
  timebox_hours: number;
  owner: string;
}

export interface Epic {
  epic_id: string;
  title: string;
  description: string;
  tickets: string[];
}

export interface Story {
  story_id: string;
  title: string;
  description: string;
  epic_id: string;
  tickets: string[];
}

export interface Spec {
  title: string;
  description: string;
  requirements: string[];
  acceptance_criteria: string[];
  technical_notes?: string[];
}

export interface ProjectState {
  initialized: boolean;
  last_brief?: string;
  last_retro?: string;
  tickets_completed: number;
  current_sprint?: string;
}

export interface Brief {
  date: string;
  progress: string[];
  blockers: string[];
  next_actions: string[];
  test_status: {
    coverage_percent: number;
    tests_passing: boolean;
  };
}

export interface Retro {
  date: string;
  what_worked: string[];
  what_didnt: string[];
  actions: string[];
  efficiency_notes: string[];
}

export interface VelocityReport {
  date: string;
  tickets_completed: number;
  average_cycle_time: number;
  coverage_percent: number;
  redo_rate: number;
}