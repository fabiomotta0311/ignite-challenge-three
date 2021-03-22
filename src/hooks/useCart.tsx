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
    
    return []
  });

  const addProduct = async (productId: number) => {
    try {
      const stock = await api.get<Stock>(`/stock/${productId}`)

      const productExists = cart.find(p => p.id === productId);

      if (!stock) {
        toast.error('Erro na adição do produto');

      } else if (stock.data.amount <= 0) {
        toast.error('Quantidade solicitada fora de estoque');

      } else if (productExists) {
        const updatedProd = cart.map(product => product.id === productId
          ? { ...product, amount: product.amount + 1 } 
          : product,
        )

        setCart(updatedProd)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProd))
      } else {
        const product = await api.get(`/products/${productId}`)

        const newProduct = [...cart, {
          id: product.data.id,
          title: product.data.title,
          price: product.data.price,
          image: product.data.image,
          amount: 1
        }]

        setCart(newProduct)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newProduct))
      }

    } catch {
      toast.error('Erro na adição do produto');

    }
  };

  const removeProduct = (productId: number) => {

    try {
      const productExists = cart.find(p => p.id === productId);

      if (!productExists){
        toast.error('Erro na remoção do produto');

      } else {
        const removedProduct = cart.filter(p => p.id !== productId)

        setCart(removedProduct);

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(removedProduct))
      }
      
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    console.log('entrei na função')
    console.log('updated-amount: ', amount)
    if (amount <= 0) return

    try {
      const stock = await api.get<Stock>(`/stock/${productId}`)
      console.log('stock-amount: ', stock.data.amount)
      
      if (!stock){
        toast.error('Erro na alteração de quantidade do produto');

      } else if ( amount > stock.data.amount) {
        console.log('entrei aqui')
        toast.error('Quantidade solicitada fora de estoque');

      } else {
        const updatedProduct = cart.map(
          product => product.id === productId
            ? { ...product, amount: amount }
            : product,
        )

        setCart(updatedProduct)

        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedProduct))
      }

      
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

  return context;
}
