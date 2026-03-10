import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { workflowEngine } from '@/lib/workflow-automation';

const { firestore } = initializeFirebase();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;
    
    // Log webhook for debugging
    console.log('Webhook received:', { event, data });
    
    // Trigger workflows based on webhook event
    switch (event) {
      case 'lead.created':
        await workflowEngine.triggerWorkflow('lead_created', data);
        break;
      case 'lead.status_changed':
        await workflowEngine.triggerWorkflow('lead_status_changed', data);
        break;
      case 'task.created':
        await workflowEngine.triggerWorkflow('task_created', data);
        break;
      case 'order.created':
        await workflowEngine.triggerWorkflow('order_created', data);
        break;
      case 'email.sent':
        await workflowEngine.triggerWorkflow('email_sent', data);
        break;
      default:
        console.log('Unknown webhook event:', event);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Webhook processed: ${event}` 
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Simple health check endpoint
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook endpoint is active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in webhook health check:', error);
    return NextResponse.json(
      { success: false, error: 'Health check failed' },
      { status: 500 }
    );
  }
}
