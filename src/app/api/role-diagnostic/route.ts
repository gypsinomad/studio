import { NextRequest, NextResponse } from 'next/server';
import { diagnoseRoleIssue, makeRoleSticky } from '@/firebase/firestore/role-diagnostic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'diagnose') {
      const userEmail = searchParams.get('email') || 'akhilvenugopal@gmail.com';
      const diagnosis = await diagnoseRoleIssue(userEmail);
      
      return NextResponse.json({
        success: true,
        data: diagnosis
      });
    }
    
    if (action === 'fix') {
      const userEmail = searchParams.get('email') || 'akhilvenugopal@gmail.com';
      const result = await makeRoleSticky(userEmail);
      
      return NextResponse.json({
        success: true,
        data: result
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    });
    
  } catch (error: any) {
    console.error('Error in role-diagnostic API:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

export const runtime = 'edge';
