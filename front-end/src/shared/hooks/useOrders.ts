import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, OrdersListParams } from '@services/orderService';
import { OrderCreateForm } from '@shared/types';
import { useOrderStore } from '@stores/order.store';

export const useOrders = () => {
  const queryClient = useQueryClient();
  const { addOrder, clearCurrentOrder } = useOrderStore();

  // Get orders list
  const useOrdersList = (params: OrdersListParams = {}) => {
    return useQuery({
      queryKey: ['orders', params],
      queryFn: () => orderService.getOrders(params),
      staleTime: 2 * 60 * 1000, // 2 minutes
    });
  };

  // Get single order
  const useOrder = (orderId: string) => {
    return useQuery({
      queryKey: ['order', orderId],
      queryFn: () => orderService.getOrder(orderId),
      enabled: !!orderId,
      staleTime: 30 * 1000, // 30 seconds (orders change frequently)
    });
  };

  // Get order tracking
  const useOrderTracking = (orderId: string) => {
    return useQuery({
      queryKey: ['order', orderId, 'tracking'],
      queryFn: () => orderService.getOrderTracking(orderId),
      enabled: !!orderId,
      refetchInterval: 30 * 1000, // Refresh every 30 seconds
      staleTime: 10 * 1000, // 10 seconds
    });
  };

  // Get order statistics
  const useOrderStats = () => {
    return useQuery({
      queryKey: ['orders', 'stats'],
      queryFn: orderService.getOrderStats,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: orderService.createOrder,
    onSuccess: (newOrder) => {
      // Add to orders list
      addOrder(newOrder);
      
      // Clear current order from store
      clearCurrentOrder();
      
      // Invalidate and refetch orders
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'stats'] });
      
      // Set the new order in cache
      queryClient.setQueryData(['order', newOrder.id], newOrder);
    },
  });

  // Update order status mutation
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ orderId, status, notes }: {
      orderId: string;
      status: string;
      notes?: string;
    }) => orderService.updateOrderStatus(orderId, status, notes),
    onSuccess: (updatedOrder) => {
      // Update the specific order in cache
      queryClient.setQueryData(['order', updatedOrder.id], updatedOrder);
      
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'stats'] });
    },
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      orderService.cancelOrder(orderId, reason),
    onSuccess: (cancelledOrder) => {
      // Update the specific order in cache
      queryClient.setQueryData(['order', cancelledOrder.id], cancelledOrder);
      
      // Invalidate orders list to refetch
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', 'stats'] });
    },
  });

  // Request refund mutation
  const requestRefundMutation = useMutation({
    mutationFn: ({ orderId, reason, amount }: {
      orderId: string;
      reason: string;
      amount?: number;
    }) => orderService.requestRefund(orderId, reason, amount),
    onSuccess: (_, variables) => {
      // Invalidate the specific order to refetch updated status
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Rate order mutation
  const rateOrderMutation = useMutation({
    mutationFn: ({ orderId, rating, review }: {
      orderId: string;
      rating: number;
      review?: string;
    }) => orderService.rateOrder(orderId, rating, review),
    onSuccess: (_, variables) => {
      // Invalidate the specific order to refetch updated status
      queryClient.invalidateQueries({ queryKey: ['order', variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  // Download invoice mutation
  const downloadInvoiceMutation = useMutation({
    mutationFn: orderService.downloadInvoice,
  });

  return {
    // Query hooks
    useOrdersList,
    useOrder,
    useOrderTracking,
    useOrderStats,

    // Mutation hooks
    createOrder: createOrderMutation,
    updateOrderStatusMutation,
    cancelOrder: cancelOrderMutation,
    requestRefund: requestRefundMutation,
    rateOrder: rateOrderMutation,
    downloadInvoice: downloadInvoiceMutation,

    // Store state and actions
    ...useOrderStore(),
  };
};