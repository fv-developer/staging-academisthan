import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Bell, Menu, User, Settings, LogOut, 
  Upload, Camera, Shield, Sparkles, Building2, Globe,
  UserMinus, Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import api, { notifications as notificationsApi } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import logo from '@/assets/academisthan-logo-official.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface HeaderProps {
  onMenuClick: () => void;
  showSearch?: boolean;
}

export function Header({ onMenuClick, showSearch = false }: HeaderProps) {
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  const { requestPermission, showLocalNotification } = usePushNotifications(user?.id);

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate your account? Your profile will be hidden from the directory, but you can reactivate it at any time.')) return;
    try {
      await api.apiRequest('/profiles/deactivate', { method: 'POST' });
      alert('Account deactivated successfully.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate account');
    }
  };

  const handleDelete = async () => {
    if (!confirm('WARNING: Are you sure you want to delete your account permanently? This action CANNOT be undone.')) return;
    if (!profile) return;
    try {
      await api.apiRequest(`/profiles/${profile.id}`, { method: 'DELETE' });
      alert('Your account has been deleted permanently.');
      signOut();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  useEffect(() => {
    if (user && localStorage.getItem('request_notification_permission_on_next_load') === 'true') {
      localStorage.removeItem('request_notification_permission_on_next_load');
      requestPermission();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Auto-refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getAll();
      setNotifications(data.slice(0, 5)); // Show only latest 5 in dropdown
      const unreadCount = data.filter((n: Notification) => !n.is_read).length;
      setNotificationCount(unreadCount);

      // Check for new notifications to trigger local popup
      if (data.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const lastNotifiedId = localStorage.getItem('last_notified_id');
        const unreadNotifications = data.filter((n: Notification) => !n.is_read);
        
        if (unreadNotifications.length > 0) {
          if (!lastNotifiedId) {
            // First load, just initialize without showing popups
            localStorage.setItem('last_notified_id', unreadNotifications[0].id);
          } else {
            const lastIndex = unreadNotifications.findIndex(n => n.id === lastNotifiedId);
            let newNotifications = unreadNotifications;
            if (lastIndex !== -1) {
              newNotifications = unreadNotifications.slice(0, lastIndex);
            }
            
            if (newNotifications.length > 0) {
              newNotifications.slice(0, 3).reverse().forEach(n => {
                showLocalNotification(n.title, n.message, n.link);
              });
              localStorage.setItem('last_notified_id', unreadNotifications[0].id);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'certificate': return 'bg-blue-500';
      case 'course': return 'bg-green-500';
      case 'event': return 'bg-amber-500';
      case 'institution_status': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const userInitials = profile?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left: Menu Button Only */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>

        {/* Center: Search */}
        {showSearch && (
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search anything... (Ctrl+K)"
                className="pl-9 pr-4 w-full bg-muted/50 border-0 focus-visible:ring-1"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Right: Action Buttons + Notifications & Profile */}
        <div className="flex items-center gap-2">
          {/* Institution Registration Button */}
          <Link to="/institution-register" className="hidden md:block">
            <Button variant="outline" size="sm" className="gap-2">
              <Building2 className="h-4 w-4" />
              <span className="hidden lg:inline">Institution Registration</span>
              <span className="lg:hidden">Register</span>
            </Button>
          </Link>

          {/* Go to Website Button */}
          <Link to="/" className="hidden md:block">
            <Button variant="outline" size="sm" className="gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden lg:inline">Go to Website</span>
              <span className="lg:hidden">Website</span>
            </Button>
          </Link>

          {/* Search Icon (Mobile) */}
          {showSearch && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <Search className="h-5 w-5" />
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="relative rounded-full w-9 h-9 border border-gray-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 shadow-sm"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-1 p-2 max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        notification.is_read ? 'hover:bg-muted/30' : 'hover:bg-muted/50 bg-muted/20'
                      }`}
                      onClick={() => {
                        handleMarkAsRead(notification.id);
                        if (notification.link) {
                          window.location.href = notification.link;
                        }
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full ${getNotificationColor(notification.type)} mt-1.5 shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${notification.is_read ? 'font-normal' : 'font-medium'}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-center justify-center text-sm font-medium cursor-pointer"
                onClick={async () => {
                  await notificationsApi.markAllAsRead();
                  loadNotifications();
                }}
              >
                Mark all as read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                  <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start text-left">
                  <span className="text-sm font-medium leading-none">
                    {profile?.full_name || 'User'}
                  </span>
                  <span className="text-xs text-muted-foreground leading-none mt-0.5">
                    {profile?.designation || user?.email}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{profile?.full_name || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                    {profile?.membership_id && (
                      <p className="text-xs text-amber-600 font-medium mt-1">
                        {profile.membership_id}
                      </p>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link to="/dashboard" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  My Profile
                </Link>
              </DropdownMenuItem>

              {profile?.institution_id ? (
                <DropdownMenuItem asChild>
                  <Link to="/dashboard?tool=institute" className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" />
                    My Institute
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link to="/institution-register" className="cursor-pointer">
                    <Building2 className="mr-2 h-4 w-4" />
                    Institute Registration
                  </Link>
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem 
                onClick={handleDeactivate}
                className="text-amber-600 focus:text-amber-600 cursor-pointer"
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Deactivate My Account
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600 focus:text-red-600 cursor-pointer"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete My Account
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem 
                onClick={signOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
