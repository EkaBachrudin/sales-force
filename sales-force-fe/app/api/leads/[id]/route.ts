import { NextRequest, NextResponse } from 'next/server';
import { mockLeads } from '@/lib/mockData';
import { Lead } from '@/lib/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Find the lead index
    const leadIndex = mockLeads.findIndex((lead) => lead.id === id);

    if (leadIndex === -1) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Update the lead
    const updatedLead: Lead = {
      ...mockLeads[leadIndex],
      ...body,
    };

    mockLeads[leadIndex] = updatedLead;

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Find the lead index
    const leadIndex = mockLeads.findIndex((lead) => lead.id === id);

    if (leadIndex === -1) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Remove the lead
    mockLeads.splice(leadIndex, 1);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
