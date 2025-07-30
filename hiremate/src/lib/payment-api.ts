/**
 * Payment API Functions
 * Handles Stripe payment integration
 */

const AI_SERVICE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || 'http://localhost:8000'

export interface CheckoutSessionResponse {
  success: boolean
  checkout_url?: string
  session_id?: string
  error_message?: string
}

/**
 * Create a Stripe checkout session for credit purchase
 */
export async function createCheckoutSession(
  userId: string, 
  packageId: string
): Promise<CheckoutSessionResponse> {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/stripe/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        package_id: packageId
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to create checkout session')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    return {
      success: false,
      error_message: `Failed to create checkout session: ${error}`
    }
  }
}