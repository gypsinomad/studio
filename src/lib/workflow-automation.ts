export interface WorkflowTrigger {
  type: 'lead_created' | 'lead_status_changed' | 'task_created' | 'order_created' | 'email_sent';
  conditions?: Record<string, any>;
}

export interface WorkflowAction {
  type: 'send_email' | 'create_task' | 'update_field' | 'notify_user' | 'delay';
  config: Record<string, any>;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  actions: WorkflowAction[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'welcome-sequence',
    name: 'Welcome Sequence',
    description: 'Send welcome email and create follow-up task for new leads',
    trigger: {
      type: 'lead_created',
      conditions: {
        source: 'website'
      }
    },
    actions: [
      {
        type: 'send_email',
        config: {
          templateId: 'welcome',
          delay: 0
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Follow up with new lead',
          assignTo: 'sales-team',
          dueIn: '24h',
          priority: 'high'
        }
      },
      {
        type: 'delay',
        config: {
          hours: 48
        }
      },
      {
        type: 'send_email',
        config: {
          templateId: 'followup',
          delay: 0
        }
      }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'lead-conversion',
    name: 'Lead Conversion',
    description: 'Actions when lead is converted to customer',
    trigger: {
      type: 'lead_status_changed',
      conditions: {
        newStatus: 'converted'
      }
    },
    actions: [
      {
        type: 'update_field',
        config: {
          field: 'convertedAt',
          value: 'now()'
        }
      },
      {
        type: 'create_task',
        config: {
          title: 'Onboard new customer',
          assignTo: 'customer-success',
          dueIn: '72h',
          priority: 'medium'
        }
      },
      {
        type: 'notify_user',
        config: {
          users: ['sales-manager'],
          message: 'New lead converted: {{leadName}}'
        }
      }
    ],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export class WorkflowEngine {
  private workflows: Workflow[] = [];
  
  constructor() {
    this.workflows = DEFAULT_WORKFLOWS;
  }
  
  addWorkflow(workflow: Workflow): void {
    this.workflows.push(workflow);
  }
  
  removeWorkflow(id: string): void {
    this.workflows = this.workflows.filter(w => w.id !== id);
  }
  
  updateWorkflow(id: string, updates: Partial<Workflow>): void {
    const index = this.workflows.findIndex(w => w.id === id);
    if (index !== -1) {
      this.workflows[index] = { ...this.workflows[index], ...updates, updatedAt: new Date() };
    }
  }
  
  async triggerWorkflow(triggerType: string, data: any): Promise<void> {
    const activeWorkflows = this.workflows.filter(w => 
      w.isActive && w.trigger.type === triggerType
    );
    
    for (const workflow of activeWorkflows) {
      if (this.checkConditions(workflow.trigger.conditions, data)) {
        await this.executeActions(workflow.actions, data);
      }
    }
  }
  
  private checkConditions(conditions: Record<string, any> | undefined, data: any): boolean {
    if (!conditions) return true;
    
    return Object.entries(conditions).every(([key, value]) => {
      return data[key] === value;
    });
  }
  
  private async executeActions(actions: WorkflowAction[], data: any): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action, data);
    }
  }
  
  private async executeAction(action: WorkflowAction, data: any): Promise<void> {
    switch (action.type) {
      case 'send_email':
        await this.sendEmail(action.config, data);
        break;
      case 'create_task':
        await this.createTask(action.config, data);
        break;
      case 'update_field':
        await this.updateField(action.config, data);
        break;
      case 'notify_user':
        await this.notifyUser(action.config, data);
        break;
      case 'delay':
        await this.delay(action.config);
        break;
    }
  }
  
  private async sendEmail(config: any, data: any): Promise<void> {
    // Implementation would integrate with email service
    console.log('Sending email:', { config, data });
  }
  
  private async createTask(config: any, data: any): Promise<void> {
    // Implementation would create task in task management system
    console.log('Creating task:', { config, data });
  }
  
  private async updateField(config: any, data: any): Promise<void> {
    // Implementation would update field in database
    console.log('Updating field:', { config, data });
  }
  
  private async notifyUser(config: any, data: any): Promise<void> {
    // Implementation would send notification
    console.log('Notifying users:', { config, data });
  }
  
  private async delay(config: any): Promise<void> {
    const hours = config.hours || 0;
    const milliseconds = hours * 60 * 60 * 1000;
    await new Promise(resolve => setTimeout(resolve, milliseconds));
  }
}

export const workflowEngine = new WorkflowEngine();
