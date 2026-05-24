import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotificationById,
  clearAllNotifications,
} from "../../../features/notifications/notificationsSlice";

/**
 * Custom hook for managing notifications
 * Provides access to notifications state and dispatch functions
 */
export const useNotifications = () => {
  const dispatch = useDispatch();
  const { items, unreadCount, loading, error, pagination } = useSelector(
    (state) => state.notifications,
  );

  // Fetch notifications on component mount
  useEffect(() => {
    dispatch(getNotifications({ page: 1, limit: 10 }));
    dispatch(getUnreadCount());
  }, [dispatch]);

  // Mark single notification as read
  const handleMarkAsRead = useCallback(
    (notificationId) => {
      dispatch(markAsRead(notificationId));
    },
    [dispatch],
  );

  // Mark all notifications as read
  const handleMarkAllAsRead = useCallback(() => {
    dispatch(markAllAsRead());
  }, [dispatch]);

  // Delete single notification
  const handleDeleteNotification = useCallback(
    (notificationId) => {
      dispatch(deleteNotificationById(notificationId));
    },
    [dispatch],
  );

  // Delete all notifications
  const handleDeleteAllNotifications = useCallback(() => {
    dispatch(clearAllNotifications());
  }, [dispatch]);

  // Load more notifications (pagination)
  const handleLoadMore = useCallback(() => {
    const nextPage = pagination.page + 1;
    if (nextPage <= pagination.pages) {
      dispatch(getNotifications({ page: nextPage, limit: 10 }));
    }
  }, [dispatch, pagination]);

  return {
    notifications: items,
    unreadCount,
    loading,
    error,
    pagination,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    deleteNotification: handleDeleteNotification,
    deleteAllNotifications: handleDeleteAllNotifications,
    loadMore: handleLoadMore,
    hasMore: pagination.page < pagination.pages,
  };
};

export default useNotifications;
