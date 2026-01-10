import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CreditCard, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  holder_name: string;
  is_default: boolean;
}

export const PaymentMethods = () => {
  const { user } = useAuth();
  const [cards, setCards] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    holder_name: '',
    card_number: '',
    exp_month: '',
    exp_year: '',
  });

  useEffect(() => {
    if (user) {
      fetchPaymentMethods();
    }
  }, [user]);

  const fetchPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      // Sample data for demo
      setCards([
        { id: '1', brand: 'visa', last4: '4242', exp_month: 12, exp_year: 2026, holder_name: 'John Doe', is_default: true },
        { id: '2', brand: 'mastercard', last4: '8888', exp_month: 6, exp_year: 2025, holder_name: 'John Doe', is_default: false },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!newCard.holder_name || !newCard.card_number || !newCard.exp_month || !newCard.exp_year) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const brand = newCard.card_number.startsWith('4') ? 'visa' : 'mastercard';
      const last4 = newCard.card_number.slice(-4);

      const { error } = await supabase
        .from('payment_methods')
        .insert({
          user_id: user?.id,
          brand,
          last4,
          exp_month: parseInt(newCard.exp_month),
          exp_year: parseInt(newCard.exp_year),
          holder_name: newCard.holder_name,
          is_default: cards.length === 0
        });

      if (error) throw error;

      toast.success('Payment method added successfully');
      setShowAddCard(false);
      setNewCard({ holder_name: '', card_number: '', exp_month: '', exp_year: '' });
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error('Failed to add payment method');
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      // Remove default from all cards
      await supabase
        .from('payment_methods')
        .update({ is_default: false })
        .eq('user_id', user?.id);

      // Set new default
      await supabase
        .from('payment_methods')
        .update({ is_default: true })
        .eq('id', cardId);

      toast.success('Default payment method updated');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to update default payment method');
    }
  };

  const handleRemoveCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      toast.success('Payment method removed');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Error removing card:', error);
      toast.error('Failed to remove payment method');
    }
  };

  const getCardGradient = (brand: string) => {
    const gradients: Record<string, string> = {
      visa: 'bg-gradient-to-br from-blue-600 to-blue-800',
      mastercard: 'bg-gradient-to-br from-orange-500 to-red-600',
      amex: 'bg-gradient-to-br from-gray-600 to-gray-800',
    };
    return gradients[brand] || 'bg-gradient-to-br from-gray-700 to-gray-900';
  };

  return (
    <motion.div 
      className="bg-card/50 backdrop-blur border border-border rounded-3xl p-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Payment Methods</h3>
        <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
          <DialogTrigger asChild>
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Payment Method</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="holder_name">Cardholder Name</Label>
                <Input 
                  id="holder_name"
                  value={newCard.holder_name}
                  onChange={(e) => setNewCard({ ...newCard, holder_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label htmlFor="card_number">Card Number</Label>
                <Input 
                  id="card_number"
                  value={newCard.card_number}
                  onChange={(e) => setNewCard({ ...newCard, card_number: e.target.value.replace(/\D/g, '').slice(0, 16) })}
                  placeholder="4242 4242 4242 4242"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="exp_month">Expiry Month</Label>
                  <Input 
                    id="exp_month"
                    value={newCard.exp_month}
                    onChange={(e) => setNewCard({ ...newCard, exp_month: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                    placeholder="12"
                  />
                </div>
                <div>
                  <Label htmlFor="exp_year">Expiry Year</Label>
                  <Input 
                    id="exp_year"
                    value={newCard.exp_year}
                    onChange={(e) => setNewCard({ ...newCard, exp_year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    placeholder="2026"
                  />
                </div>
              </div>
              <Button onClick={handleAddCard} className="w-full">
                Add Payment Method
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading payment methods...</div>
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">No payment methods added</p>
          <Button onClick={() => setShowAddCard(true)}>
            Add Your First Card
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.id}
              className="relative group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              {/* Credit Card Design */}
              <div className={`relative overflow-hidden rounded-2xl p-6 h-48 ${getCardGradient(card.brand)} shadow-lg group-hover:scale-105 transition-transform duration-300`}>
                {/* Card Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_70%)]" />
                </div>
                
                <div className="relative h-full flex flex-col justify-between">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-8 bg-white/20 rounded backdrop-blur-sm" />
                    <span className="text-white font-bold uppercase text-sm">{card.brand}</span>
                  </div>

                  {/* Card Number */}
                  <div className="font-mono text-white text-lg tracking-wider">
                    •••• •••• •••• {card.last4}
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/60 text-xs">Card Holder</p>
                      <p className="text-white font-medium text-sm">{card.holder_name}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs">Expires</p>
                      <p className="text-white font-medium text-sm">
                        {card.exp_month.toString().padStart(2, '0')}/{card.exp_year.toString().slice(-2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Default Badge */}
                {card.is_default && (
                  <div className="absolute top-4 right-4 px-2 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs text-white font-medium">
                    Default
                  </div>
                )}
              </div>

              {/* Card Actions (Visible on Hover) */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {!card.is_default && (
                  <Button 
                    size="sm" 
                    onClick={() => handleSetDefault(card.id)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Set Default
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="destructive"
                  onClick={() => handleRemoveCard(card.id)}
                >
                  Remove
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
