import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Fetch subscription and usage data from OpenAI
    const response = await fetch('https://api.openai.com/v1/dashboard/billing/subscription', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch OpenAI subscription:', response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch OpenAI balance' },
        { status: response.status }
      );
    }

    const subscription = await response.json();
    
    // Get current usage for this billing cycle
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const usageResponse = await fetch(
      `https://api.openai.com/v1/dashboard/billing/usage?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      }
    );

    let totalUsed = 0;
    if (usageResponse.ok) {
      const usage = await usageResponse.json();
      totalUsed = (usage.total_usage || 0) / 100; // Convert cents to dollars
    }

    // Extract credit information
    const hardLimitUsd = subscription.hard_limit_usd || 0;
    const softLimitUsd = subscription.soft_limit_usd || 0;
    const systemHardLimitUsd = subscription.system_hard_limit_usd || 0;
    
    // Calculate remaining balance (use the most restrictive limit)
    const effectiveLimit = Math.min(
      hardLimitUsd > 0 ? hardLimitUsd : Infinity,
      softLimitUsd > 0 ? softLimitUsd : Infinity,
      systemHardLimitUsd > 0 ? systemHardLimitUsd : Infinity
    );
    
    const remaining = effectiveLimit - totalUsed;

    return NextResponse.json({
      success: true,
      balance: {
        limit: effectiveLimit,
        used: totalUsed,
        remaining: remaining > 0 ? remaining : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching OpenAI balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch OpenAI balance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
