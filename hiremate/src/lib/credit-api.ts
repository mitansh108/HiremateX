/**
 * Credit Management API Functions
 * Connects Next.js frontend with Python AI credit service
 */

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export interface CreditInfo {
  success: boolean
  credits: number
  user_id?: string
  error_message?: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  action_type: string
  credits_used: number
  credits_before: number
  credits_after: number
  success: boolean
  metadata: any
  created_at: string
}

export interface CreditHistory {
  success: boolean
  transactions: CreditTransaction[]
  total_count: number
  error_message?: string
}

export interface CreditDeductionResult {
  success: boolean
  credits_before: number
  credits_after: number
  credits_used: number
  transaction_id?: string
  error_message?: string
  action_type: string
}

/**
 * Check user's current credit balance
 */
export async function checkUserCredits(userId: string): Promise<CreditInfo> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/credits/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to check credits:', error)
    return {
      success: false,
      credits: 0,
      error_message: `Failed to check credits: ${error}`
    }
  }
}

/**
 * Deduct credits for an action (used internally by AI service)
 */
export async function deductCredits(
  userId: string, 
  actionType: string, 
  metadata?: any
): Promise<CreditDeductionResult> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/credits/deduct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        action_type: actionType,
        metadata: metadata || {}
      })
    })

    const result = await response.json()

    if (!response.ok) {
      // Handle insufficient credits (402) or other errors
      return {
        success: false,
        credits_before: 0,
        credits_after: 0,
        credits_used: 0,
        error_message: result.detail || 'Credit deduction failed',
        action_type: actionType
      }
    }

    return result
  } catch (error) {
    console.error('Failed to deduct credits:', error)
    return {
      success: false,
      credits_before: 0,
      credits_after: 0,
      credits_used: 0,
      error_message: `Failed to deduct credits: ${error}`,
      action_type: actionType
    }
  }
}

/**
 * Get user's credit transaction history
 */
export async function getCreditHistory(userId: string, limit: number = 50): Promise<CreditHistory> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/credits/history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        limit: limit
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to get credit history:', error)
    return {
      success: false,
      transactions: [],
      total_count: 0,
      error_message: `Failed to get credit history: ${error}`
    }
  }
}

/**
 * Add credits to user account (for purchases/admin)
 */
export async function addCredits(
  userId: string, 
  creditsToAdd: number, 
  reason: string = 'purchase'
): Promise<any> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/credits/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        credits_to_add: creditsToAdd,
        reason: reason
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to add credits:', error)
    return {
      success: false,
      error_message: `Failed to add credits: ${error}`
    }
  }
}

/**
 * Check if user has enough credits for an action (without deducting)
 */
export async function checkCreditsForAction(userId: string, actionType: string): Promise<{
  hasCredits: boolean
  currentCredits: number
  requiredCredits: number
  creditsAfter: number
}> {
  try {
    // Get current credits
    const creditInfo = await checkUserCredits(userId)
    
    if (!creditInfo.success) {
      return {
        hasCredits: false,
        currentCredits: 0,
        requiredCredits: 1,
        creditsAfter: 0
      }
    }

    // Credit costs (should match Python service)
    const creditCosts: { [key: string]: number } = {
      'job_search': 1,
      'cover_letter': 1,
      'cold_email': 1,
      'linkedin_dm': 1,
      'linkedin_connection': 1,
      'resume_analysis': 2,
      'skill_analysis': 1,
      'bulk_application': 5,
      'premium_feature': 3
    }

    const requiredCredits = creditCosts[actionType] || 1
    const currentCredits = creditInfo.credits
    const hasCredits = currentCredits >= requiredCredits

    return {
      hasCredits,
      currentCredits,
      requiredCredits,
      creditsAfter: hasCredits ? currentCredits - requiredCredits : currentCredits
    }
  } catch (error) {
    console.error('Failed to check credits for action:', error)
    return {
      hasCredits: false,
      currentCredits: 0,
      requiredCredits: 1,
      creditsAfter: 0
    }
  }
}

/**
 * Enhanced API calls that automatically handle credit deduction
 * These wrap your existing AI service calls
 */

export async function generateCoverLetterWithCredits(
  userId: string,
  jobData: any,
  resumeData: any,
  skillMatchData: any
) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/generate-cover-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        job_data: jobData,
        resume_data: resumeData,
        skill_match_data: skillMatchData
      })
    })

    const result = await response.json()

    if (!response.ok) {
      // Handle insufficient credits or other errors
      if (response.status === 402) {
        throw new Error('Insufficient credits for cover letter generation')
      }
      throw new Error(result.detail || 'Cover letter generation failed')
    }

    return result
  } catch (error) {
    console.error('Cover letter generation failed:', error)
    throw error
  }
}

export async function generateColdEmailWithCredits(
  userId: string,
  jobData: any,
  resumeData: any,
  skillMatchData: any
) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/generate-cold-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        job_data: jobData,
        resume_data: resumeData,
        skill_match_data: skillMatchData
      })
    })

    const result = await response.json()

    if (!response.ok) {
      if (response.status === 402) {
        throw new Error('Insufficient credits for cold email generation')
      }
      throw new Error(result.detail || 'Cold email generation failed')
    }

    return result
  } catch (error) {
    console.error('Cold email generation failed:', error)
    throw error
  }
}

export async function generateLinkedInDMWithCredits(
  userId: string,
  jobData: any,
  resumeData: any,
  skillMatchData: any
) {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/generate-linkedin-dm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        job_data: jobData,
        resume_data: resumeData,
        skill_match_data: skillMatchData
      })
    })

    const result = await response.json()

    if (!response.ok) {
      if (response.status === 402) {
        throw new Error('Insufficient credits for LinkedIn DM generation')
      }
      throw new Error(result.detail || 'LinkedIn DM generation failed')
    }

    return result
  } catch (error) {
    console.error('LinkedIn DM generation failed:', error)
    throw error
  }
}