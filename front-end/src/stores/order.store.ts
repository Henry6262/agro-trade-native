import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Order, OrderItem, Product } from '../shared/types';

interface OrderState {
  // Current order being created
  currentOrder: {
    items: OrderItem[];
    deliveryAddress: any;
    paymentMethod: string | null;
    notes: string;
    totalAmount: number;
  };

  // Orders list
  orders: Order[];
  isLoading: boolean;
  error: string | null;

  // Actions for current order creation
  addItemToOrder: (product: Product, quantity: number) => void;
  removeItemFromOrder: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  setDeliveryAddress: (address: any) => void;
  setPaymentMethod: (method: string) => void;
  setOrderNotes: (notes: string) => void;
  clearCurrentOrder: () => void;
  calculateTotal: () => void;

  // Actions for orders management
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useOrderStore = create<OrderState>()(
  immer((set, get) => ({
    // Initial state
    currentOrder: {
      items: [],
      deliveryAddress: null,
      paymentMethod: null,
      notes: '',
      totalAmount: 0,
    },
    orders: [],
    isLoading: false,
    error: null,

    // Current order actions
    addItemToOrder: (product: Product, quantity: number) => {
      set((state) => {
        const existingItemIndex = state.currentOrder.items.findIndex(
          (item) => item.productId === product.id
        );

        if (existingItemIndex >= 0) {
          // Update existing item
          state.currentOrder.items[existingItemIndex]!.quantity += quantity;
          state.currentOrder.items[existingItemIndex]!.totalPrice =
            state.currentOrder.items[existingItemIndex]!.quantity * product.price;
        } else {
          // Add new item
          const newItem: OrderItem = {
            id: `item-${Date.now()}`,
            productId: product.id,
            product,
            quantity,
            unitPrice: product.price,
            totalPrice: quantity * product.price,
          };
          state.currentOrder.items.push(newItem);
        }
      });
      get().calculateTotal();
    },

    removeItemFromOrder: (productId: string) => {
      set((state) => {
        state.currentOrder.items = state.currentOrder.items.filter(
          (item) => item.productId !== productId
        );
      });
      get().calculateTotal();
    },

    updateItemQuantity: (productId: string, quantity: number) => {
      set((state) => {
        const itemIndex = state.currentOrder.items.findIndex(
          (item) => item.productId === productId
        );
        if (itemIndex >= 0) {
          if (quantity <= 0) {
            state.currentOrder.items.splice(itemIndex, 1);
          } else {
            state.currentOrder.items[itemIndex]!.quantity = quantity;
            state.currentOrder.items[itemIndex]!.totalPrice =
              quantity * state.currentOrder.items[itemIndex]!.unitPrice;
          }
        }
      });
      get().calculateTotal();
    },

    setDeliveryAddress: (address: any) => {
      set((state) => {
        state.currentOrder.deliveryAddress = address;
      });
    },

    setPaymentMethod: (method: string) => {
      set((state) => {
        state.currentOrder.paymentMethod = method;
      });
    },

    setOrderNotes: (notes: string) => {
      set((state) => {
        state.currentOrder.notes = notes;
      });
    },

    clearCurrentOrder: () => {
      set((state) => {
        state.currentOrder = {
          items: [],
          deliveryAddress: null,
          paymentMethod: null,
          notes: '',
          totalAmount: 0,
        };
      });
    },

    calculateTotal: () => {
      set((state) => {
        state.currentOrder.totalAmount = state.currentOrder.items.reduce(
          (total, item) => total + item.totalPrice,
          0
        );
      });
    },

    // Orders management actions
    setOrders: (orders: Order[]) => {
      set((state) => {
        state.orders = orders;
      });
    },

    addOrder: (order: Order) => {
      set((state) => {
        state.orders.unshift(order);
      });
    },

    updateOrderStatus: (orderId: string, status: string) => {
      set((state) => {
        const orderIndex = state.orders.findIndex((order) => order.id === orderId);
        if (orderIndex >= 0) {
          state.orders[orderIndex]!.status = status as any;
          state.orders[orderIndex]!.updatedAt = new Date().toISOString();
        }
      });
    },

    setLoading: (isLoading: boolean) => {
      set((state) => {
        state.isLoading = isLoading;
      });
    },

    setError: (error: string | null) => {
      set((state) => {
        state.error = error;
      });
    },
  }))
);
