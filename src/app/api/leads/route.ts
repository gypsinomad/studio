import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const status = searchParams.get('status');
    
    let query = firestore.collection('leads').orderBy('createdAt', 'desc');
    
    if (status) {
      query = query.where('status', '==', status);
    }
    
    if (limitParam) {
      query = query.limit(parseInt(limitParam));
    }
    
    const snapshot = await query.get();
    const leads = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const leadData = await request.json();
    
    // Validate required fields
    const requiredFields = ['fullName', 'email', 'companyName'];
    const missingFields = requiredFields.filter(field => !leadData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Add timestamps
    const leadWithTimestamps = {
      ...leadData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: leadData.status || 'new'
    };
    
    const docRef = await firestore.collection('leads').add(leadWithTimestamps);
    
    return NextResponse.json({
      success: true,
      data: {
        id: docRef.id,
        ...leadWithTimestamps
      }
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}
