import { useEffect, useState } from "react";
import { cartApi } from "../api";
import { useAuth } from "../context/AuthContext";

export function useCartCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user?.role !== "customer") {
      setCount(0);
      return;
    }
    cartApi
      .get()
      .then((cart) => setCount(cart.item_count || 0))
      .catch(() => setCount(0));
  }, [user]);

  return count;
}
