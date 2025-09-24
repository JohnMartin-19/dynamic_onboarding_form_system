import React from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  FileText, 
  AlertCircle, 
  Settings,
  User
} from 'lucide-react';
import { Notification } from '../types/forms';

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationCenter({ notifications, onMarkAsRead, onMarkAllAsRead }: NotificationCenterProps) {
  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'form_submission':
        return <FileText className="w-5 h-5 text-primary-green" />;
      case 'form_approved':
        return <Check className="w-5 h-5 text-success" />;
      case 'form_rejected':
        return <AlertCircle className="w-5 h-5 text-error" />;
      case 'system':
        return <Settings className="w-5 h-5 text-primary-orange" />;
      default:
        return <Bell className="w-5 h-5 text-text-gray" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'form_submission':
        return 'bg-green-50 border-green-200';
      case 'form_approved':
        return 'bg-green-50 border-green-200';
      case 'form_rejected':
        return 'bg-red-50 border-red-200';
      case 'system':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h2>Notifications</h2>
          {unreadCount > 0 && (
            <Badge className="bg-primary-orange text-white">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={onMarkAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all as read
          </Button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`p-4 transition-all cursor-pointer hover:shadow-md ${
              !notification.read 
                ? `${getNotificationColor(notification.type)} border-l-4` 
                : 'bg-white border-gray'
            }`}
            onClick={() => !notification.read && onMarkAsRead(notification.id)}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${!notification.read ? 'text-text-dark' : 'text-text-gray'}`}>
                    {notification.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-text-gray">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary-orange rounded-full" />
                    )}
                  </div>
                </div>
                
                <p className={`text-sm mt-1 ${!notification.read ? 'text-text-dark' : 'text-text-gray'}`}>
                  {notification.message}
                </p>
                
                {/* Additional notification data */}
                {notification.data && notification.type === 'form_submission' && (
                  <div className="mt-3 p-3 bg-neutral-gray rounded-lg">
                    <div className="flex items-center space-x-2 text-sm">
                      <User className="w-4 h-4 text-text-gray" />
                      <span className="text-text-gray">Submission ID:</span>
                      <span className="font-mono text-text-dark">{notification.data.submissionId}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && (
        <Card className="financial-card text-center py-12">
          <Bell className="w-12 h-12 text-text-gray mx-auto mb-4" />
          <h3 className="mb-2">No Notifications</h3>
          <p className="text-text-gray">You're all caught up! New notifications will appear here.</p>
        </Card>
      )}

      {/* Notification Settings */}
      <Card className="financial-card">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-text-dark">Notification Settings</h4>
            <p className="text-sm text-text-gray">Manage your notification preferences</p>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="financial-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-gray">Total Notifications</p>
              <p className="text-xl font-semibold text-text-dark">{notifications.length}</p>
            </div>
            <Bell className="w-6 h-6 text-text-gray" />
          </div>
        </Card>
        
        <Card className="financial-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-gray">Unread</p>
              <p className="text-xl font-semibold text-primary-orange">{unreadCount}</p>
            </div>
            <AlertCircle className="w-6 h-6 text-primary-orange" />
          </div>
        </Card>
        
        <Card className="financial-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-gray">Form Submissions</p>
              <p className="text-xl font-semibold text-primary-green">
                {notifications.filter(n => n.type === 'form_submission').length}
              </p>
            </div>
            <FileText className="w-6 h-6 text-primary-green" />
          </div>
        </Card>
      </div>
    </div>
  );
}