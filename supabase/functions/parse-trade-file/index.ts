import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// CSV Parser for MT4/MT5 exports
function parseCSV(csvText: string) {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/['"]/g, ''));
  
  const trades = [];
  for (let i = 1; i < lines.length; i++) {
    // Handle CSV values that may contain commas within quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ''));
    
    const trade: Record<string, string> = {};
    headers.forEach((header, index) => {
      trade[header] = values[index] || '';
    });
    
    // Map common MT4/MT5 CSV column names
    const mappedTrade = {
      external_ticket: trade.ticket || trade.order || trade['#'] || trade.id || '',
      symbol: trade.symbol || trade.pair || trade.instrument || '',
      direction: parseDirection(trade.type || trade.direction || trade.side || ''),
      entry_price: parseFloat(trade['open price'] || trade.entry || trade['entry price'] || trade.price || '0'),
      exit_price: parseFloat(trade['close price'] || trade.exit || trade['exit price'] || trade.close || '0'),
      lot_size: parseFloat(trade.size || trade.lots || trade.volume || trade.quantity || '0'),
      profit_loss: parseFloat(trade.profit || trade['p/l'] || trade.pnl || trade['profit/loss'] || '0'),
      open_time: trade['open time'] || trade['entry time'] || trade.date || trade['open date'] || '',
      close_time: trade['close time'] || trade['exit time'] || trade['close date'] || '',
      commission: parseFloat(trade.commission || '0'),
      swap: parseFloat(trade.swap || '0'),
      notes: trade.comment || trade.notes || '',
    };
    
    // Only add if we have at least a ticket or symbol
    if (mappedTrade.external_ticket || mappedTrade.symbol) {
      trades.push(mappedTrade);
    }
  }
  
  return trades;
}

function parseDirection(typeStr: string): 'long' | 'short' | 'neutral' {
  const lower = typeStr.toLowerCase();
  if (lower.includes('buy') || lower.includes('long')) return 'long';
  if (lower.includes('sell') || lower.includes('short')) return 'short';
  return 'neutral';
}

function parseOutcome(pnl: number): 'win' | 'loss' | 'breakeven' {
  if (pnl > 0) return 'win';
  if (pnl < 0) return 'loss';
  return 'breakeven';
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  try {
    // Try various date formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get user from auth
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log('Processing file upload for user:', user.id);

    // Parse multipart form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    console.log('File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    let trades: any[] = [];
    const fileName = file.name.toLowerCase();

    // Parse based on file type
    if (fileName.endsWith('.csv')) {
      const text = await file.text();
      trades = parseCSV(text);
      console.log('Parsed', trades.length, 'trades from CSV');
    } else if (fileName.endsWith('.txt')) {
      // Some brokers export as TXT (tab-separated)
      const text = await file.text();
      // Convert tabs to commas for CSV parsing
      const csvText = text.split('\n').map(line => line.replace(/\t/g, ',')).join('\n');
      trades = parseCSV(csvText);
      console.log('Parsed', trades.length, 'trades from TXT');
    } else {
      return new Response(JSON.stringify({ 
        error: 'Unsupported file format. Please use CSV or TXT files exported from your broker.' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    if (trades.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No trades found in file. Please check the file format matches your broker export.' 
      }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      })
    }

    // Import trades to database
    const importedTrades = [];
    const skippedTrades = [];
    const errors: { ticket: string; error: string }[] = [];

    for (const trade of trades) {
      try {
        // Skip if no meaningful data
        if (!trade.symbol && !trade.external_ticket) {
          continue;
        }

        // Check for duplicates by external_ticket if provided
        if (trade.external_ticket) {
          const { data: existing } = await supabaseClient
            .from('journal_entries')
            .select('id')
            .eq('user_id', user.id)
            .eq('external_ticket', trade.external_ticket)
            .maybeSingle();

          if (existing) {
            skippedTrades.push(trade.external_ticket);
            continue;
          }
        }

        // Parse date
        const entryDate = parseDate(trade.open_time) || new Date().toISOString().split('T')[0];
        const pnl = trade.profit_loss + (trade.commission || 0) + (trade.swap || 0);

        // Insert trade
        const { data: inserted, error: insertError } = await supabaseClient
          .from('journal_entries')
          .insert({
            user_id: user.id,
            title: `${trade.symbol || 'Trade'} - ${trade.direction}`,
            entry_date: entryDate,
            import_source: 'file_upload',
            external_ticket: trade.external_ticket || null,
            instrument: trade.symbol || null,
            direction: trade.direction,
            entry_price: trade.entry_price || null,
            exit_price: trade.exit_price || null,
            quantity: trade.lot_size || null,
            pnl: pnl,
            outcome: parseOutcome(pnl),
            commission: trade.commission || null,
            swap: trade.swap || null,
            auto_imported: true,
            notes_added: false,
            is_draft: false,
            is_shared: false,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Insert error:', insertError);
          errors.push({ ticket: trade.external_ticket || 'unknown', error: insertError.message });
        } else {
          importedTrades.push(inserted);
        }
      } catch (err: any) {
        console.error('Processing error:', err);
        errors.push({ ticket: trade.external_ticket || 'unknown', error: err.message });
      }
    }

    // Log import history
    await supabaseClient.from('import_history').insert({
      user_id: user.id,
      import_type: 'file_upload',
      source_name: file.name,
      trades_imported: importedTrades.length,
      trades_skipped: skippedTrades.length,
      status: errors.length > 0 ? 'partial' : 'completed',
      error_message: errors.length > 0 ? JSON.stringify(errors) : null,
      metadata: { file_size: file.size, file_type: file.type },
    });

    console.log(`Import complete: ${importedTrades.length} imported, ${skippedTrades.length} skipped, ${errors.length} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        total_found: trades.length,
        imported: importedTrades.length,
        skipped: skippedTrades.length,
        errors: errors.length,
        error_details: errors.slice(0, 5), // Return first 5 errors
        trades: importedTrades,
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      }
    )
  }
})
