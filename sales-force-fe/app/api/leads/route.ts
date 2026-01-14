import { NextRequest, NextResponse } from 'next/server';
import { mockLeads } from '@/lib/mockData';
import { PaginatedResponse, Lead } from '@/lib/types';

interface LeadsFilters {
  stage?: string;
  search?: string;
  propertyType?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface LeadsQueryParams {
  page: number;
  limit: number;
  stage?: string;
  search?: string;
  propertyType?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}

function parseQueryParams(request: NextRequest): LeadsQueryParams {
  const searchParams = request.nextUrl.searchParams;

  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '50')));

  return {
    page,
    limit,
    stage: searchParams.get('stage') || undefined,
    search: searchParams.get('search') || undefined,
    propertyType: searchParams.get('propertyType') || undefined,
    source: searchParams.get('source') || undefined,
    dateFrom: searchParams.get('dateFrom') || undefined,
    dateTo: searchParams.get('dateTo') || undefined,
  };
}

function filterLeads(leads: Lead[], filters: LeadsFilters): Lead[] {
  return leads.filter((lead) => {
    // Filter by stage
    if (filters.stage && filters.stage !== 'all' && lead.stage !== filters.stage) {
      return false;
    }

    // Filter by search (name or phone)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = lead.name.toLowerCase().includes(searchLower);
      const matchesPhone = lead.phone.replace(/\D/g, '').includes(filters.search.replace(/\D/g, ''));
      const matchesEmail = lead.email?.toLowerCase().includes(searchLower);

      if (!matchesName && !matchesPhone && !matchesEmail) {
        return false;
      }
    }

    // Filter by property type
    if (filters.propertyType && filters.propertyType !== 'all' && lead.propertyType !== filters.propertyType) {
      return false;
    }

    // Filter by source
    if (filters.source && filters.source !== 'all' && lead.source !== filters.source) {
      return false;
    }

    // Filter by date range
    const leadDate = new Date(lead.createdAt);
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      if (leadDate < fromDate) {
        return false;
      }
    }
    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (leadDate > toDate) {
        return false;
      }
    }

    return true;
  });
}

function paginateLeads(leads: Lead[], page: number, limit: number): PaginatedResponse<Lead> {
  const total = leads.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const data = leads.slice(startIndex, endIndex);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryParams(request);

    // Apply filters
    const filteredLeads = filterLeads(mockLeads, {
      stage: params.stage,
      search: params.search,
      propertyType: params.propertyType,
      source: params.source,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    });

    // Sort by created date descending (newest first)
    filteredLeads.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    // Apply pagination
    const paginatedResponse = paginateLeads(filteredLeads, params.page, params.limit);

    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
