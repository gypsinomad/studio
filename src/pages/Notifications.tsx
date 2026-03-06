import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  X, 
  Settings, 
  Mail, 
  MessageSquare, 
  AlertTriangle, 
  Info, 
  CheckCircle, 
  XCircle,
  Clock,
  User,
  Package,
  DollarSign,
  FileText,
  Calendar,
  Star,
  Trash2,
  Archive,
  Eye,
  RefreshCw
} from 'lucide-react';
import { collection, query, where, getDocs, updateDoc, doc, orderBy, onSnapshot, limit, startAfter } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'task' | 'order' | 'payment' | 'system';
  category: string;
  isRead: boolean;
  userId: string;
  entityId?: string;
  entityType?: string;
  actionUrl?: string;
  createdAt: any;
  readAt?: any;
  orgId: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskNotifications: boolean;
  orderNotifications: boolean;
  paymentNotifications: boolean;
  systemNotifications: boolean;
  marketingEmails: boolean;
  weeklyDigest: boolean;
  quietHours: boolean;
  quietStart: string;
  quietEnd: string;
}

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All Notifications', icon: <Bell className="h-4 w-4" /> },
  { value: 'info', label: 'Information', icon: <Info className="h-4 w-4 text-blue-500" /> },
  { value: 'success', label: 'Success', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  { value: 'warning', label: 'Warning', icon: <AlertTriangle className="h-4 w-4 text-yellow-500" /> },
  { value: 'error', label: 'Error', icon: <XCircle className="h-4 w-4 text-red-500" /> },
  { value: 'task', label: 'Tasks', icon: <Calendar className="h-4 w-4 text-purple-500" /> },
  { value: 'order', label: 'Orders', icon: <Package className="h-4 w-4 text-blue-500" /> },
  { value: 'payment', label: 'Payments', icon: <DollarSign className="h-4 w-4 text-green-500" /> },
  { value: 'system', label: 'System', icon: <Settings className="h-4 w-4 text-gray-500" /> }
];

const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'read' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    taskNotifications: true,
    orderNotifications: true,
    paymentNotifications: true,
    systemNotifications: true,
    marketingEmails: false,
    weeklyDigest: true,
    quietHours: false,
    quietStart: '22:00',
    quietEnd: '08:00'
  });
  const pageSize = 20;

  // Fetch notifications
  useEffect(() => {
    if (!user?.uid) return;

    const fetchNotifications = async (loadMore = false) => {
      try {
        let q = query(
          collection(db, 'notifications'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(pageSize)
        );

        if (loadMore && lastVisible) {
          q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            startAfter(lastVisible),
            limit(pageSize)
          );
        }

        const querySnapshot = await getDocs(q);
        const notificationsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Notification));

        if (loadMore) {
          setNotifications(prev => [...prev, ...notificationsData]);
        } else {
          setNotifications(notificationsData);
        }

        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        setHasMore(querySnapshot.docs.length === pageSize);
        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setLoading(false);
        setRefreshing(false);
      }
    };

    // Set up real-time listener
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      setNotifications(notificationsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Refresh notifications
  const handleRefresh = () => {
    setRefreshing(true);
    setLastVisible(null);
    // Real-time listener will handle refresh
  };

  // Load more notifications
  const loadMore = () => {
    // In a real implementation, you would fetch more data
    console.log('Load more notifications');
  };

  // Mark as read
  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: true,
        readAt: new Date()
      });
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  // Mark as unread
  const markAsUnread = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        isRead: false,
        readAt: null
      });
      toast.success('Notification marked as unread');
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast.error('Failed to mark notification as unread');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        deleted: true,
        deletedAt: new Date()
      });
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);
      for (const notification of unreadNotifications) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          isRead: true,
          readAt: new Date()
        });
      }
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  // Update settings
  const updateSettings = async (key: keyof NotificationSettings, value: boolean | string) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      
      // In a real implementation, save to Firestore
      await updateDoc(doc(db, 'users', user?.uid || ''), {
        notificationSettings: newSettings
      });
      
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = !searchTerm || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || notification.type === selectedType;
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'read' && notification.isRead) ||
      (selectedFilter === 'unread' && !notification.isRead);

    return matchesSearch && matchesType && matchesFilter;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'task': return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'order': return <Package className="h-5 w-5 text-blue-500" />;
      case 'payment': return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'system': return <Settings className="h-5 w-5 text-gray-500" />;
      default: return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'task': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'order': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment': return 'bg-green-100 text-green-800 border-green-200';
      case 'system': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNotificationDate = (date: any) => {
    const notificationDate = date.toDate();
    if (isToday(notificationDate)) {
      return `Today at ${format(notificationDate, 'h:mm a')}`;
    } else if (isYesterday(notificationDate)) {
      return `Yesterday at ${format(notificationDate, 'h:mm a')}`;
    } else {
      return format(notificationDate, 'MMM dd, yyyy h:mm a');
    }
  };

  const getRelativeTime = (date: any) => {
    return formatDistanceToNow(date.toDate(), { addSuffix: true });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Notifications</h1>
            <p className="text-muted-foreground">Stay updated with your activities</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-start space-x-4">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
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
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your activities</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            <Check className="h-4 w-4 mr-2" />
            Mark All Read
          </Button>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-yellow-600">{unreadCount}</p>
              </div>
              <Mail className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today</p>
                <p className="text-2xl font-bold">
                  {notifications.filter(n => isToday(n.createdAt.toDate())).length}
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
                  {notifications.filter(n => {
                    const notificationDate = n.createdAt.toDate();
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return notificationDate >= weekAgo;
                  }).length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center space-x-2">
                  {type.icon}
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedFilter} onValueChange={(value: 'all' | 'read' | 'unread') => setSelectedFilter(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="unread">Unread</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Recent Notifications</span>
            <span className="text-sm font-normal text-muted-foreground">
              {filteredNotifications.length} notifications
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No notifications found
            </div>
          ) : (
            <>
              <div className="max-h-[600px] overflow-y-auto">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-4 p-4 border-b hover:bg-gray-50 transition-colors ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`flex-shrink-0 mt-1 ${!notification.isRead ? 'relative' : ''}`}>
                      {getNotificationIcon(notification.type)}
                      {!notification.isRead && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                          {notification.title}
                        </h3>
                        <Badge className={getNotificationColor(notification.type)}>
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-900 mb-2">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                          <span>{formatNotificationDate(notification.createdAt)}</span>
                          <span>•</span>
                          <span>{getRelativeTime(notification.createdAt)}</span>
                        </div>
                        <div className="flex space-x-1">
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          {notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsUnread(notification.id)}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Load More */}
              {hasMore && (
                <div className="flex justify-center p-4 border-t">
                  <Button variant="outline" onClick={loadMore}>
                    Load More
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Card className={`transition-all duration-300 ${showSettings ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Channels</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <Switch
                  id="email-notifications"
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => updateSettings('emailNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <Switch
                  id="push-notifications"
                  checked={settings.pushNotifications}
                  onCheckedChange={(checked) => updateSettings('pushNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="marketing-emails">Marketing Emails</Label>
                <Switch
                  id="marketing-emails"
                  checked={settings.marketingEmails}
                  onCheckedChange={(checked) => updateSettings('marketingEmails', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="weekly-digest">Weekly Digest</Label>
                <Switch
                  id="weekly-digest"
                  checked={settings.weeklyDigest}
                  onCheckedChange={(checked) => updateSettings('weeklyDigest', checked)}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Notification Types</h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="task-notifications">Task Notifications</Label>
                <Switch
                  id="task-notifications"
                  checked={settings.taskNotifications}
                  onCheckedChange={(checked) => updateSettings('taskNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="order-notifications">Order Notifications</Label>
                <Switch
                  id="order-notifications"
                  checked={settings.orderNotifications}
                  onCheckedChange={(checked) => updateSettings('orderNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="payment-notifications">Payment Notifications</Label>
                <Switch
                  id="payment-notifications"
                  checked={settings.paymentNotifications}
                  onCheckedChange={(checked) => updateSettings('paymentNotifications', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="system-notifications">System Notifications</Label>
                <Switch
                  id="system-notifications"
                  checked={settings.systemNotifications}
                  onCheckedChange={(checked) => updateSettings('systemNotifications', checked)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quiet Hours</h3>
            <div className="flex items-center justify-between">
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <Switch
                id="quiet-hours"
                checked={settings.quietHours}
                onCheckedChange={(checked) => updateSettings('quietHours', checked)}
              />
            </div>
            {settings.quietHours && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quiet-start">Start Time</Label>
                  <Input
                    id="quiet-start"
                    type="time"
                    value={settings.quietStart}
                    onChange={(e) => updateSettings('quietStart', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="quiet-end">End Time</Label>
                  <Input
                    id="quiet-end"
                    type="time"
                    value={settings.quietEnd}
                    onChange={(e) => updateSettings('quietEnd', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
