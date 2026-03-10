'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverEvent, 
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy,
  arrayMove 
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Plus, GripVertical, Building, Phone, Mail, Calendar, DollarSign, User } from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, onSnapshot, addDoc } from 'firebase/firestore';

import { useFirestore, useUser } from '@/firebase';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

// Country flag emojis
const COUNTRY_FLAGS: Record<string, string> = {
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Canada': '🇨🇦',
  'Australia': '🇦🇺',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'Italy': '🇮🇹',
  'Spain': '🇪🇸',
  'Netherlands': '🇳🇱',
  'Belgium': '🇧🇪',
  'Switzerland': '🇨🇭',
  'Austria': '🇦🇹',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'China': '🇨🇳',
  'Japan': '🇯🇵',
  'South Korea': '🇰🇷',
  'India': '🇮🇳',
  'Singapore': '🇸🇬',
  'Malaysia': '🇲🇾',
  'Thailand': '🇹🇭',
  'Vietnam': '🇻🇳',
  'Indonesia': '🇮🇩',
  'Philippines': '🇵🇭',
  'Brazil': '🇧🇷',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Peru': '🇵🇪',
  'Colombia': '🇨🇴',
  'Mexico': '🇲🇽',
  'South Africa': '🇿🇦',
  'Egypt': '🇪🇬',
  'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪',
  'Ghana': '🇬🇭',
  'Morocco': '🇲🇦',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Israel': '🇮🇱',
  'Turkey': '🇹🇷',
  'Russia': '🇷🇺',
  'New Zealand': '🇳🇿',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Sri Lanka': '🇱🇰',
  'Nepal': '🇳🇵',
  'Myanmar': '🇲🇲',
  'Cambodia': '🇰🇭',
  'Laos': '🇱🇦',
  'Mongolia': '🇲🇳',
  'Kazakhstan': '🇰🇿',
  'Uzbekistan': '🇺🇿',
  'Afghanistan': '🇦🇫',
  'Iran': '🇮🇷',
  'Iraq': '🇮🇶',
  'Syria': '🇸🇾',
  'Jordan': '🇯🇴',
  'Lebanon': '🇱🇧',
  'Libya': '🇱🇾',
  'Tunisia': '🇹🇳',
  'Algeria': '🇩🇿',
  'Sudan': '🇸🇩',
  'Ethiopia': '🇪🇹',
  'Tanzania': '🇹🇿',
  'Uganda': '🇺🇬',
  'Rwanda': '🇷🇼',
  'DRC': '🇨🇩',
  'Congo': '🇨🇬',
  'Gabon': '🇬🇦',
  'Cameroon': '🇨🇲',
  'Ivory Coast': '🇨🇮',
  'Senegal': '🇸🇳',
  'Mali': '🇲🇱',
  'Burkina Faso': '🇧🇫',
  'Niger': '🇳🇪',
  'Chad': '🇹🇩',
  'Central African Republic': '🇨🇫',
  'South Sudan': '🇸🇸',
  'Eritrea': '🇪🇷',
  'Djibouti': '🇩🇯',
  'Somalia': '🇸🇴',
  'Mozambique': '🇲🇿',
  'Zimbabwe': '🇿🇼',
  'Botswana': '🇧🇼',
  'Namibia': '🇳🇦',
  'Lesotho': '🇱🇸',
  'Eswatini': '🇸🇿',
  'Madagascar': '🇲🇬',
  'Mauritius': '🇲🇺',
  'Venezuela': '🇻🇪',
  'Ecuador': '🇪🇨',
  'Bolivia': '🇧🇴',
  'Paraguay': '🇵🇾',
  'Uruguay': '🇺🇾',
  'Guatemala': '🇬🇹',
  'Belize': '🇧🇿',
  'El Salvador': '🇸🇻',
  'Honduras': '🇭🇳',
  'Nicaragua': '🇳🇮',
  'Costa Rica': '🇨🇷',
  'Panama': '🇵🇦',
  'Cuba': '🇨🇺',
  'Jamaica': '🇯🇲',
  'Haiti': '🇭🇹',
  'Dominican Republic': '🇩🇴',
  'Puerto Rico': '🇵🇷',
  'Trinidad and Tobago': '🇹🇹',
  'Barbados': '🇧🇧',
  'Bahamas': '🇧🇸',
  'Grenada': '🇬🇩',
  'St. Lucia': '🇱🇨',
  'St. Vincent': '🇻🇨',
  'Dominica': '🇩🇲',
  'Fiji': '🇫🇯',
  'Papua New Guinea': '🇵🇬',
  'Solomon Islands': '🇸🇧',
  'Vanuatu': '🇻🇺',
  'Samoa': '🇼🇸',
  'Tonga': '🇹🇴',
  'Kiribati': '🇰🇮',
  'Tuvalu': '🇹🇻',
  'Nauru': '🇳🇷',
  'Palau': '🇵🇼',
  'Micronesia': '🇫🇲',
  'Marshall Islands': '🇲🇭',
  'Cook Islands': '🇨🇰',
  'Niue': '🇳🇺',
  'Tokelau': '🇹🇰',
  'American Samoa': '🇦🇸',
  'Guam': '🇬🇺',
  'Northern Mariana': '🇲🇵',
  'Wallis Futuna': '🇼🇫'
};

const PIPELINE_COLUMNS = [
  'New',
  'Contacted', 
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost'
];

const SOURCE_COLORS: Record<string, string> = {
  'WhatsApp': 'bg-green-100 text-green-800',
  'Email': 'bg-blue-100 text-blue-800',
  'Direct': 'bg-purple-100 text-purple-800',
  'Web': 'bg-orange-100 text-orange-800',
  'Referral': 'bg-pink-100 text-pink-800',
  'Other': 'bg-gray-100 text-gray-800'
};

interface Lead {
  id: string;
  fullName: string;
  company?: string;
  country: string;
  phone?: string;
  email?: string;
  source: string;
  status: string;
  assignedTo?: string;
  expectedValue?: number;
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

// Sortable Card Component
const SortableLeadCard: React.FC<{ 
  lead: Lead; 
  onClick: (lead: Lead) => void;
}> = ({ lead, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCountryFlag = (country: string) => {
    return COUNTRY_FLAGS[country] || '🌍';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg border shadow-sm p-4 mb-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick(lead)}
      {...attributes}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1">
            <GripVertical className="h-4 w-4 text-gray-400" {...listeners} />
          </div>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
              {getInitials(lead.assignedTo || 'UN')}
            </AvatarFallback>
          </Avatar>
        </div>
        <Badge className={SOURCE_COLORS[lead.source] || 'bg-gray-100 text-gray-800'}>
          {lead.source}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <div className="font-semibold text-gray-900">
          {lead.company || lead.fullName}
        </div>
        
        {lead.company && (
          <div className="text-sm text-gray-600">
            {lead.fullName}
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <span>{getCountryFlag(lead.country)}</span>
          <span>{lead.country}</span>
        </div>
        
        {lead.expectedValue && (
          <div className="flex items-center space-x-1 text-sm font-medium text-green-600">
            <DollarSign className="h-3 w-3" />
            <span>{lead.expectedValue.toLocaleString()}</span>
          </div>
        )}
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Calendar className="h-3 w-3" />
          <span>{formatDistanceToNow(lead.createdAt?.toDate() || new Date(), { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  );
};

// Column Component
const PipelineColumn: React.FC<{
  title: string;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onAddLead: (status: string) => void;
}> = ({ title, leads, onLeadClick, onAddLead }) => {
  const totalValue = leads.reduce((sum, lead) => sum + (lead.expectedValue || 0), 0);

  return (
    <Card className="flex-1 min-w-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="text-xs">
              {leads.length}
            </Badge>
            {totalValue > 0 && (
              <Badge variant="outline" className="text-xs">
                ${totalValue.toLocaleString()}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="mb-3">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={() => onAddLead(title)}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Lead
          </Button>
        </div>
        
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-[200px]">
            {leads.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No leads in this stage
              </div>
            ) : (
              leads.map((lead) => (
                <SortableLeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={onLeadClick}
                />
              ))
            )}
          </div>
        </SortableContext>
      </CardContent>
    </Card>
  );
};

const LeadPipeline: React.FC = () => {
  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  
  if (!isBrowser) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='text-muted-foreground'>Loading...</div>
      </div>
    );
  }
  
  const { user, userProfile } = useUser();
  const firestore = useFirestore();
  
  // For now, use user.uid as orgId if userProfile.orgId is not available
  // TODO: Fix orgId assignment in user profile creation
  const orgId = userProfile?.orgId || user?.uid;
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addLeadStatus, setAddLeadStatus] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Fetch leads
  useEffect(() => {
    if (!orgId) return;

    const q = query(
      collection(firestore, 'leads'),
      where('orgId', '==', orgId),
      where('status', 'in', PIPELINE_COLUMNS)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const leadsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lead));
      setLeads(leadsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [orgId]);

  // Group leads by status
  const leadsByStatus = PIPELINE_COLUMNS.reduce((acc, status) => {
    acc[status] = leads.filter(lead => lead.status === status);
    return acc;
  }, {} as Record<string, Lead[]>);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const leadId = active.id as string;
    const newStatus = over.id as string;

    if (!PIPELINE_COLUMNS.includes(newStatus)) return;

    try {
      await updateDoc(doc(firestore, 'leads', leadId), {
        status: newStatus,
        updatedAt: new Date()
      });
      
      toast.success(`Lead moved to ${newStatus}`);
      
      // Log activity
      await addDoc(collection(firestore, 'activity_logs'), {
        orgId: orgId,
        type: 'lead_status_changed',
        message: `Lead status changed to ${newStatus}`,
        userId: user?.uid,
        userName: user?.displayName || 'Unknown User',
        timestamp: new Date(),
        relatedEntity: {
          type: 'lead',
          id: leadId,
          name: leads.find(l => l.id === leadId)?.fullName || 'Unknown'
        }
      });
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }

    setActiveId(null);
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowDetailSheet(true);
  };

  const handleAddLead = (status: string) => {
    setAddLeadStatus(status);
    setShowAddDialog(true);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getCountryFlag = (country: string) => {
    return COUNTRY_FLAGS[country] || '🌍';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Lead Pipeline</h1>
            <p className="text-muted-foreground">Drag and drop leads to move them through your pipeline</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-4">
          {PIPELINE_COLUMNS.map(() => (
            <Card key={Math.random()}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 rounded"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Pipeline</h1>
          <p className="text-muted-foreground">Drag and drop leads to move them through your pipeline</p>
        </div>
        <Button onClick={() => handleAddLead('New')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Lead
        </Button>
      </div>

      {/* Pipeline Board */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-7 gap-4 min-w-[1400px]">
          {PIPELINE_COLUMNS.map((status) => (
            <div
              key={status}
              id={status}
              className="min-h-[600px]"
            >
              <PipelineColumn
                title={status}
                leads={leadsByStatus[status]}
                onLeadClick={handleLeadClick}
                onAddLead={handleAddLead}
              />
            </div>
          ))}
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="bg-white rounded-lg border shadow-lg p-4 rotate-3 scale-105">
              {(() => {
                const lead = leads.find(l => l.id === activeId);
                if (!lead) return null;
                
                return (
                  <div className="space-y-2">
                    <div className="font-semibold">
                      {lead.company || lead.fullName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {lead.company && lead.fullName}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span>{getCountryFlag(lead.country)}</span>
                      <span>{lead.country}</span>
                    </div>
                    {lead.expectedValue && (
                      <div className="text-sm font-medium text-green-600">
                        ${lead.expectedValue.toLocaleString()}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Lead Detail Sheet */}
      <Sheet open={showDetailSheet} onOpenChange={setShowDetailSheet}>
        <SheetContent className="w-[600px] sm:w-[800px]">
          <SheetHeader>
            <SheetTitle>Lead Details</SheetTitle>
          </SheetHeader>
          {selectedLead && (
            <div className="mt-6 space-y-6">
              {/* Lead Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Lead Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                    <div className="font-medium">{selectedLead.fullName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Company</div>
                    <div className="font-medium">{selectedLead.company || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Country</div>
                    <div className="font-medium flex items-center space-x-2">
                      <span>{getCountryFlag(selectedLead.country)}</span>
                      <span>{selectedLead.country}</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div className="font-medium">{selectedLead.email || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div className="font-medium">{selectedLead.phone || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Expected Value</div>
                    <div className="font-medium">${selectedLead.expectedValue || 0}</div>
                  </div>
                </div>
              </div>

              {/* Status and Source */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Status & Source</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <div className="mt-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        {selectedLead.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Source</div>
                    <div className="mt-2">
                      <Badge className={SOURCE_COLORS[selectedLead.source] || 'bg-gray-100 text-gray-800'}>
                        {selectedLead.source}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Assigned To</div>
                    <div className="font-medium">{selectedLead.assignedTo || '-'}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Created Date</div>
                    <div className="font-medium">
                      {format(selectedLead.createdAt?.toDate() || new Date(), 'MMM dd, yyyy')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="flex space-x-2">
                  {selectedLead.phone && (
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  )}
                  {selectedLead.email && (
                    <Button variant="outline" size="sm">
                      <Mail className="h-4 w-4 mr-2" />
                      Email
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default LeadPipeline;










