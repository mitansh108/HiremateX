"""
Credit Deduction Decorator
Automatically handles credit deduction for API endpoints
"""

from functools import wraps
from fastapi import HTTPException
from agents.simple_credit_manager import credit_manager
import asyncio

def require_credits(action_type: str, credits_required: int = None):
    """
    Decorator to automatically deduct credits before executing an endpoint
    
    Args:
        action_type: Type of action (e.g., 'job_search', 'cover_letter')
        credits_required: Optional override for credit cost
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(request: dict):  # Simplified - FastAPI passes request as dict
            print(f"🔍 DEBUG - Request received: {request}")
            print(f"🔍 DEBUG - Request keys: {list(request.keys()) if request else 'None'}")
            
            if not request:
                raise HTTPException(status_code=400, detail="No request data received")
            
            if 'user_id' not in request:
                print(f"❌ user_id missing from request. Available keys: {list(request.keys())}")
                raise HTTPException(status_code=400, detail="user_id is required for credit deduction")
            
            user_id = request['user_id']
            print(f"✅ Found user_id: {user_id}")
            
            # Prepare metadata
            metadata = {
                'endpoint': func.__name__,
                'action_type': action_type
            }
            
            if credits_required:
                metadata['credits_override'] = credits_required
            
            print(f"💳 Processing credit deduction for {action_type} action by user {user_id}")
            
            # Process credit deduction using simple credit manager
            credit_result = await credit_manager.process_credit_usage(
                user_id=user_id,
                action_type=action_type,
                metadata=metadata
            )
            
            if not credit_result['success']:
                print(f"❌ Credit deduction failed: {credit_result['error_message']}")
                raise HTTPException(
                    status_code=402,  # Payment Required
                    detail=credit_result['error_message']
                )
            
            print(f"✅ Credits deducted successfully. New balance: {credit_result['credits_after']}")
            
            # Add credit info to request for the endpoint to use
            request['_credit_info'] = credit_result
            
            try:
                # Execute the original function
                result = await func(request)
                
                # Add credit info to response
                if isinstance(result, dict):
                    result['credit_info'] = {
                        'credits_used': credit_result['credits_used'],
                        'credits_remaining': credit_result['credits_after'],
                        'transaction_id': credit_result.get('transaction_id')
                    }
                
                return result
                
            except Exception as e:
                # If the main function fails, we should consider refunding credits
                # For now, we'll log it but not refund (to prevent abuse)
                print(f"⚠️ Function failed after credit deduction: {str(e)}")
                print(f"💰 Credits were deducted but function failed. Transaction ID: {credit_result.get('transaction_id')}")
                raise
        
        return wrapper
    return decorator

async def check_credits_only(user_id: str, action_type: str) -> dict:
    """
    Check if user has enough credits without deducting them
    Useful for frontend validation
    """
    try:
        # Get current credits
        credit_info = await credit_manager.get_user_credits(user_id)
        
        if not credit_info['success']:
            return {
                'has_credits': False,
                'current_credits': 0,
                'error': credit_info['error_message']
            }
        
        current_credits = credit_info['credits']
        
        # Get required credits for action
        from agents.simple_credit_manager import CREDIT_COSTS
        required_credits = CREDIT_COSTS.get(action_type, 1)
        
        return {
            'has_credits': current_credits >= required_credits,
            'current_credits': current_credits,
            'required_credits': required_credits,
            'credits_after': current_credits - required_credits if current_credits >= required_credits else current_credits
        }
        
    except Exception as e:
        return {
            'has_credits': False,
            'current_credits': 0,
            'error': f"Failed to check credits: {str(e)}"
        }