import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function parseOutcome(pnl: number): 'win' | 'loss' | 'breakeven' {
  if (pnl > 0) return 'win';
  if (pnl < 0) return 'loss';
  return 'breakeven';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role for webhook (no user auth)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse request body
    const body = await req.json();
    
    const {
      connection_code,
      account_number,
      broker,
      platform, // 'MT4' or 'MT5'
      trades
    } = body;

    console.log('Webhook received:', { connection_code, account_number, broker, platform, trades_count: trades?.length });

    // Validate required fields
    if (!connection_code) {
      return new Response(
        JSON.stringify({ error: 'Missing connection_code' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    if (!trades || !Array.isArray(trades)) {
      return new Response(
        JSON.stringify({ error: 'Invalid trades data' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    // Validate connection code
    const { data: connection, error: connError } = await supabaseClient
      .from('broker_connections')
      .select('user_id, id')
      .eq('connection_code', connection_code)
      .eq('status', 'active')
      .single();

    if (connError || !connection) {
      console.error('Connection lookup error:', connError);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive connection code' }),
        { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      )
    }

    console.log('Connection found for user:', connection.user_id);

    // Process each trade
    const importedTrades = [];
    const skippedTrades = [];
    const errors: { ticket: string; error: string }[] = [];
    const importSource = (platform || 'mt5').toLowerCase();

    for (const trade of trades) {
      try {
        const ticketId = trade.ticket?.toString();
        
        if (!ticketId) {
          errors.push({ ticket: 'unknown', error: 'Missing ticket number' });
          continue;
        }

        // Check for duplicates
        const { data: existing } = await supabaseClient
          .from('journal_entries')
          .select('id')
          .eq('user_id', connection.user_id)
          .eq('external_ticket', ticketId)
          .eq('broker_name', broker || 'Unknown')
          .maybeSingle();

        if (existing) {
          skippedTrades.push(ticketId);
          continue;
        }

        // Calculate P&L including commission and swap
        const profit = (parseFloat(trade.profit) || 0) + 
                       (parseFloat(trade.commission) || 0) + 
                       (parseFloat(trade.swap) || 0);

        // Determine direction
        const direction = trade.type?.toLowerCase().includes('buy') ? 'long' : 'short';

        // Parse dates
        const openTime = trade.open_time ? new Date(trade.open_time) : new Date();
        const closeTime = trade.close_time ? new Date(trade.close_time) : new Date();
        const entryDate = openTime.toISOString().split('T')[0];

        // Calculate hold time in minutes
        const holdTimeMinutes = Math.floor((closeTime.getTime() - openTime.getTime()) / 60000);

        // Insert trade
        const { data: inserted, error: insertError } = await supabaseClient
          .from('journal_entries')
          .insert({
            user_id: connection.user_id,
            title: `${trade.symbol} - ${direction}`,
            entry_date: entryDate,
            entry_time: openTime.toTimeString().slice(0, 5),
            import_source: importSource,
            external_ticket: ticketId,
            broker_name: broker || 'Unknown',
            instrument: trade.symbol,
            direction: direction,
            entry_price: parseFloat(trade.open_price) || null,
            exit_price: parseFloat(trade.close_price) || null,
            quantity: parseFloat(trade.lots) || null,
            pnl: profit,
            outcome: parseOutcome(profit),
            commission: parseFloat(trade.commission) || null,
            swap: parseFloat(trade.swap) || null,
            hold_time_minutes: holdTimeMinutes > 0 ? holdTimeMinutes : null,
            auto_imported: true,
            notes_added: false,
            is_draft: false,
            is_shared: false,
            setup_description: trade.comment || null,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Insert error for ticket', ticketId, ':', insertError);
          errors.push({ ticket: ticketId, error: insertError.message });
        } else {
          importedTrades.push(inserted);
        }
      } catch (err: any) {
        console.error('Trade processing error:', err);
        errors.push({ ticket: trade.ticket?.toString() || 'unknown', error: err.message });
      }
    }

    // Update connection last_sync and details
    await supabaseClient
      .from('broker_connections')
      .update({ 
        last_sync_at: new Date().toISOString(),
        account_number: account_number || undefined,
        broker_name: broker || undefined,
        platform: importSource,
      })
      .eq('id', connection.id);

    // Log import history
    await supabaseClient.from('import_history').insert({
      user_id: connection.user_id,
      connection_id: connection.id,
      import_type: 'mt_sync',
      source_name: `${platform || 'MT'} - ${broker || 'Unknown'}`,
      trades_imported: importedTrades.length,
      trades_skipped: skippedTrades.length,
      status: errors.length > 0 ? 'partial' : 'completed',
      error_message: errors.length > 0 ? JSON.stringify(errors.slice(0, 10)) : null,
      metadata: { account_number, broker, platform },
    });

    console.log(`Webhook complete: ${importedTrades.length} imported, ${skippedTrades.length} skipped, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedTrades.length,
        skipped: skippedTrades.length,
        errors: errors.length,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})
