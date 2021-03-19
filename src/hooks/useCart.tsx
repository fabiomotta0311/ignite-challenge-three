import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')
    
     if (storagedCart) {
       return JSON.parse(storagedCart);
     }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`)

      if (!stock.data || stock.data.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');
        return
      }

      const productExists = cart.find(p => p.id === productId);

      if (productExists) {
        setCart(
          cart.map(product => product.id === productId
            ? { ...product, amount: product.amount + 1 } 
            : product,
          ))

      } else {
        const product = await api.get(`/products/${productId}`)

        setCart([...cart, {
          id: product.data.id,
          title: product.data.title,
          price: product.data.price,
          image: product.data.image,
          amount: 1
        }])
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na adição do produto');
      return
    }
  };

  const removeProduct = (productId: number) => {

    try {
      const productExists = cart.find(p => p.id === productId);

      if (!productExists){
        toast.error('Erro na remoção do produto');
        return
      }
      setCart(cart.filter(p => p.id !== productId));

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount <= 0) return

    const productExists = await api.get<Stock>(`/stock/${productId}`)

    if (!productExists.data){
      toast.error('Erro na alteração de quantidade do produto');
      return
    }

    try {
      const stock = await api.get<Stock>(`/stock/${productId}`)

      if ( amount > stock.data.amount) {
        toast.error('Quantidade solicitada fora de estoque');
      } else {
        setCart(cart.map(
          product => product.id === productId
            ? { ...product, amount: product.amount + amount }
            : product,
        ))
      }

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context;
}
