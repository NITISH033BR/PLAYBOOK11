"use client";

import { useNotifications, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useNotifications";
import { formatDate } from "@/lib/utils";

export default function NotificationsPage() {
  const { data, isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.data || data || [];

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Notifications</h1>
        {notifications.some((n: any) => !n.read) && (
          <button
            onClick={() => markAllAsRead.mutate()}
            className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="card animate-pulse text-[#6b7280]">Loading notifications...</div>
      ) : notifications.length > 0 ? (
        <div className="space-y-2">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              onClick={() => {
                if (!notification.read) {
                  markAsRead.mutate(notification.id);
                }
              }}
              className={`card cursor-pointer transition-colors hover:border-cyan-500/50 ${
                !notification.read ? "border-cyan-500/30" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{notification.title}</h3>
                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-cyan-600" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[#9ca3af]">{notification.message}</p>
                </div>
                <div className="text-xs text-[#6b7280]">{formatDate(notification.createdAt)}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-[#6b7280]">No notifications</div>
      )}
    </div>
  );
}
