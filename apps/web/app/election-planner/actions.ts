'use server';

import { getSupabaseClient } from '../../lib/supabase';
import { ElectionPlan } from './types';

export async function loadPlan(planId: string): Promise<ElectionPlan | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('election_plans')
      .select('plan')
      .eq('id', planId)
      .single();

    if (error || !data) return null;
    return data.plan as ElectionPlan;
  } catch {
    return null;
  }
}

export async function upsertPlan(planId: string | null, plan: ElectionPlan): Promise<string> {
  const supabase = getSupabaseClient();

  if (planId) {
    const { error } = await supabase
      .from('election_plans')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', planId);

    if (!error) return planId;
  }

  // Create new record
  const { data, error } = await supabase
    .from('election_plans')
    .insert({ plan })
    .select('id')
    .single();

  if (error || !data) throw new Error(`Failed to create plan: ${error?.message}`);
  return data.id as string;
}
