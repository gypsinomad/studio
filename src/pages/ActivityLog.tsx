import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Activity, 
  User, 
  Calendar, 
  Clock,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ActivityLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string;
  description: string;
  userId: string;
  userName: string;
  createdAt: any;
  metadata?: Record<string, any>;
  orgId: string;
}

const ACTIVITY_TYPES = [
  { value: 'all', label: 'All Activities' },
  { value: 'lead', label: 'Leads' },
  { value: 'order', label: 'Orders' },
  { value: 'customer', label: 'Customers' },
  { value: 'contact', label: 'Contacts' },
  { value: 'task', label: 'Tasks' },
  { value: 'document', label: 'Documents' },
  { value: 'payment', label: 'Payments' },
  { value: 'user', label: 'Users' },
  { value: 'system', label: 'System' }
];

const ACTIVITY_ACTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'create', label: 'Created' },
  { value: 'update', label: 'Updated' },
  { value: 'delete', label: 'Deleted' },
  { value: 'status_change', label: 'Status Changed' },
  { value: 'comment', label: 'Comment Added' },
  { value: 'view', label: 'Viewed' }
];

const ActivityLog: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('7');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pageSize = 20;

  // Fetch activities
  const fetchActivities = async (loadMore = false) => {
    if (!user?.orgId) return;

    try {
      let q = query(
        collection(db, 'activity_logs'),
        where('orgId', '==', user.orgId),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (loadMore && lastVisible) {
        q = query(
          collection(db, 'activity_logs'),
          where('orgId', '==', user.orgId),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(pageSize)
        );
      }

      const querySnapshot = await getDocs(q);
      const activitiesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ActivityLog));

      if (loadMore) {
        setActivities(prev => [...prev, ...activitiesData]);
      } else {
        setActivities(activitiesData);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === pageSize);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error('Error fetching activities:', error);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [user?.orgId]);

  // Refresh activities
  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    setLastVisible(null);
    fetchActivities();
  };

  // Load more activities
  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
    fetchActivities(true);
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !searchTerm || 
      activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || activity.entityType === selectedType;
    const matchesAction = selectedAction === 'all' || activity.action === selectedAction;
    const matchesUser = selectedUser === 'all' || activity.userId === selectedUser;

    return matchesSearch && matchesType && matchesAction && matchesUser;
  });

  const getActivityIcon = (entityType: string) => {
    switch (entityType) {
      case 'lead': return <Users className="h-4 w-4 text-blue-500" />;
      case 'order': return <Package className="h-4 w-4 text-green-500" />;
      case 'customer': return <User className="h-4 w-4 text-purple-500" />;
      case 'contact': return <User className="h-4 w-4 text-orange-500" />;
      case 'task': return <Activity className="h-4 w-4 text-yellow-500" />;
      case 'document': return <FileText className="h-4 w-4 text-red-500" />;
      case 'payment': return <DollarSign className="h-4 w-4 text-green-600" />;
      case 'user': return <Settings className="h-4 w-4 text-gray-500" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'create': return 'bg-green-100 text-green-800 border-green-200';
      case 'update': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'delete': return 'bg-red-100 text-red-800 border-red-200';
      case 'status_change': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'comment': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'view': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatActivityDate = (date: any) => {
    const activityDate = date.toDate();
    if (isToday(activityDate)) {
      return `Today at ${format(activityDate, 'h:mm a')}`;
    } else if (isYesterday(activityDate)) {
      return `Yesterday at ${format(activityDate, 'h:mm a')}`;
    } else {
      return format(activityDate, 'MMM dd, yyyy h:mm a');
    }
  };

  const getRelativeTime = (date: any) => {
    return formatDistanceToNow(date.toDate(), { addSuffix: true });
  };

  const ActivityItem: React.FC<{ activity: ActivityLog }> = ({ activity }) => (
    <div className="flex items-start space-x-3 p-4 border-b hover:bg-gray-50 transition-colors">
      <div className="flex-shrink-0 mt-1">
        {getActivityIcon(activity.entityType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium">{activity.userName}</span>
          <Badge className={getActionColor(activity.action)}>
            {activity.action}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {activity.entityType}
          </span>
        </div>
        <p className="text-sm text-gray-900 mb-1">
          {activity.description}
        </p>
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span>{formatActivityDate(activity.createdAt)}</span>
          <span>•</span>
          <span>{getRelativeTime(activity.createdAt)}</span>
          {activity.metadata && Object.keys(activity.metadata).length > 0 && (
            <>
              <span>•</span>
              <span>Details available</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Activity Log</h1>
            <p className="text-muted-foreground">Track all system activities and changes</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold">{activities.length.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">
                  {activities.filter(a => isToday(a.createdAt.toDate())).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {activities.filter(a => {
                    const activityDate = a.createdAt.toDate();
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return activityDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">
                  {[...new Set(activities.map(a => a.userId))].length}
                </p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedAction} onValueChange={setSelectedAction}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            {ACTIVITY_ACTIONS.map(action => (
              <SelectItem key={action.value} value={action.value}>
                {action.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Today</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Activities</span>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredActivities.length} activities
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No activities found
            </div>
          ) : (
            <>
              <div className="max-h-[600px] overflow-y-auto">
                {filteredActivities.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
              
              {/* Pagination */}
              {hasMore && (
                <div className="flex items-center justify-between p-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {activities.length} activities
                  </div>
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={loading}
                  >
                    Load More
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Activity by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ACTIVITY_TYPES.slice(1).map(type => {
                const count = activities.filter(a => a.entityType === type.value).length;
                const percentage = activities.length > 0 ? (count / activities.length * 100).toFixed(1) : '0';
                
                return (
                  <div key={type.value} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getActivityIcon(type.value)}
                      <span className="text-sm">{type.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity by Action</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ACTIVITY_ACTIONS.slice(1).map(action => {
                const count = activities.filter(a => a.action === action.value).length;
                const percentage = activities.length > 0 ? (count / activities.length * 100).toFixed(1) : '0';
                
                return (
                  <div key={action.value} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Badge className={getActionColor(action.value)}>
                        {action.label}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{count}</span>
                      <span className="text-xs text-muted-foreground">({percentage}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ActivityLog;
