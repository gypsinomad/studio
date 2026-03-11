'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import confetti from 'canvas-confetti';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Plus, 
  Search, 
  LayoutGrid, 
  List, 
  Calendar, 
  Flag, 
  User, 
  Link, 
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Filter
} from 'lucide-react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, onSnapshot, limit } from 'firebase/firestore';

import { useFirestore, useUser } from '@/firebase';
import { format, isPast, isToday, isTomorrow, addDays } from 'date-fns';
import { toast } from 'sonner';

// Form validation schema
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  priority: z.string().min(1, "Priority is required"),
  assignedTo: z.string().optional(),
  linkedTo: z.string().optional(),
  linkedId: z.string().optional(),
  status: z.string().min(1, "Status is required")
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  priority: 'High' | 'Medium' | 'Low';
  assignedTo?: string;
  linkedTo?: string;
  linkedId?: string;
  status: 'To Do' | 'In Progress' | 'Done';
  createdAt: any;
  updatedAt: any;
  createdBy: string;
  orgId: string;
}

const TASK_COLUMNS = ['To Do', 'In Progress', 'Done'];
const PRIORITIES = ['High', 'Medium', 'Low'];
const LINK_TYPES = ['Lead', 'Order', 'Contact'];

const Tasks: React.FC = () => {
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'my' | 'overdue' | 'today'>('all');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [linkedRecords, setLinkedRecords] = useState<any[]>([]);

  // 5-second timeout fallback
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError(new Error('Permission denied or connection timeout'));
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [loading]);

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      dueDate: '',
      priority: 'Medium',
      assignedTo: '',
      linkedTo: '',
      linkedId: '',
      status: 'To Do'
    }
  });

  // Fetch tasks
  useEffect(() => {
    if (!orgId) return;

    const q = query(
      collection(firestore, 'tasks'),
      where('orgId', '==', orgId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        try {
          const tasksData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as Task));
          setTasks(tasksData);
          setLoading(false);
          setError(null);
        } catch (err) {
          setError(err as Error);
          setLoading(false);
        }
      },
      (err) => {
        setError(err as Error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [orgId]);

  // Fetch linked records based on type
  useEffect(() => {
    const linkedType = form.watch('linkedTo');
    if (!linkedType || !orgId) {
      setLinkedRecords([]);
      return;
    }

    const fetchLinkedRecords = async () => {
      try {
        let collectionName = '';
        switch (linkedType) {
          case 'Lead':
            collectionName = 'leads';
            break;
          case 'Order':
            collectionName = 'exportOrders';
            break;
          case 'Contact':
            collectionName = 'contacts';
            break;
        }

        if (!collectionName) return;

        const q = query(
          collection(firestore, collectionName),
          where('orgId', '==', orgId),
          orderBy('createdAt', 'desc'),
          limit(20)
        );

        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLinkedRecords(records);
      } catch (error) {
        console.error('Error fetching linked records:', error);
      }
    };

    fetchLinkedRecords();
  }, [form.watch('linkedTo'), orgId]);

  // Form submission
  const onSubmit = async (data: TaskFormData) => {
    if (!orgId) return;

    try {
      const taskData = {
        ...data,
        orgId: orgId,
        createdBy: user?.uid || '',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await addDoc(collection(firestore, 'tasks'), taskData);
      toast.success('Task created successfully');
      setShowAddDialog(false);
      form.reset();
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Done' ? 'In Progress' : 'Done';
    
    try {
      await updateDoc(doc(firestore, 'tasks', taskId), {
        status: newStatus,
        updatedAt: new Date()
      });

      if (newStatus === 'Done') {
        // Trigger confetti animation
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success('Task completed! 🎉');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filter === 'all' || 
      (filter === 'my' && task.assignedTo === user?.displayName) ||
      (filter === 'overdue' && task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done') ||
      (filter === 'today' && task.dueDate && isToday(new Date(task.dueDate)));

    return matchesSearch && matchesFilter;
  });

  // Group tasks by status for Kanban view
  const tasksByStatus = TASK_COLUMNS.reduce((acc, status) => {
    acc[status] = filteredTasks.filter(task => task.status === status);
    return acc;
  }, {} as Record<string, Task[]>);

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'High': 'bg-red-100 text-red-800 border-red-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Low': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'High': return <AlertCircle className="h-3 w-3" />;
      case 'Medium': return <Clock className="h-3 w-3" />;
      case 'Low': return <Circle className="h-3 w-3" />;
      default: return <Circle className="h-3 w-3" />;
    }
  };

  const getDueDateColor = (dueDate?: string) => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return 'text-red-600 font-medium';
    if (isToday(date)) return 'text-orange-600 font-medium';
    if (isTomorrow(date)) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const TaskCard: React.FC<{ task: Task }> = ({ task }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            checked={task.status === 'Done'}
            onCheckedChange={() => toggleTaskCompletion(task.id, task.status)}
            className="mt-1"
          />
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </h4>
            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)}
                  <span className="ml-1">{task.priority}</span>
                </Badge>
                
                {task.dueDate && (
                  <div className={`flex items-center space-x-1 text-xs ${getDueDateColor(task.dueDate)}`}>
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(task.dueDate), 'MMM dd')}</span>
                  </div>
                )}
              </div>
              
              {task.assignedTo && (
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(task.assignedTo)}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            {(task.linkedTo && task.linkedId) && (
              <div className="mt-2 flex items-center space-x-1 text-xs text-blue-600">
                <Link className="h-3 w-3" />
                <span>{task.linkedTo}: {task.linkedId.slice(-6).toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TaskListItem: React.FC<{ task: Task }> = ({ task }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <Checkbox
              checked={task.status === 'Done'}
              onCheckedChange={() => toggleTaskCompletion(task.id, task.status)}
            />
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium ${task.status === 'Done' ? 'line-through text-muted-foreground' : ''}`}>
                {task.title}
              </h4>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {task.description}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
            
            {task.dueDate && (
              <div className={`text-sm ${getDueDateColor(task.dueDate)}`}>
                {format(new Date(task.dueDate), 'MMM dd')}
              </div>
            )}
            
            {task.assignedTo && (
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(task.assignedTo)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Manage your tasks and to-dos</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          {['To Do', 'In Progress', 'Done'].map(column => (
            <Card key={column}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-24 bg-gray-100 rounded"></div>
                ))}
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
          <h1 className="text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground">Manage your tasks and to-dos</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Task</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter task title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add task description..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRIORITIES.map(priority => (
                              <SelectItem key={priority} value={priority}>
                                {priority}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assigned To</FormLabel>
                        <FormControl>
                          <Input placeholder="Assign to user" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TASK_COLUMNS.map(status => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="linkedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Link to</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select record type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LINK_TYPES.map(type => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="linkedId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Record</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select record" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {linkedRecords.map(record => (
                              <SelectItem key={record.id} value={record.id}>
                                {record.fullName || record.companyName || record.title || record.id.slice(-6).toUpperCase()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Task
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex space-x-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All Tasks
          </Button>
          <Button
            variant={filter === 'my' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('my')}
          >
            My Tasks
          </Button>
          <Button
            variant={filter === 'overdue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('overdue')}
          >
            Overdue
          </Button>
          <Button
            variant={filter === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('today')}
          >
            Due Today
          </Button>
        </div>
        <div className="flex items-center space-x-2 border rounded-md p-1">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tasks Display */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            <span className="text-sm">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-gray-400">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-red-400" />
            <p className="font-medium text-gray-300">Could not load data</p>
            <p className="text-sm mt-1">Check your permissions or try refreshing.</p>
          </div>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-3 gap-6">
          {TASK_COLUMNS.map((status) => (
            <Card key={status}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{status}</span>
                  <Badge variant="outline">
                    {tasksByStatus[status]?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasksByStatus[status]?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No tasks in {status}
                  </div>
                ) : (
                  tasksByStatus[status]?.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="rounded-full bg-muted p-4 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No tasks found</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Stay organized by creating tasks for follow-ups, deadlines, and important activities.
                  </p>
                  <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2" />
                        Create Your First Task
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                      </DialogHeader>
                      <TaskForm onSuccess={() => setShowAddDialog(false)} />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <TaskListItem key={task.id} task={task} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Tasks;










