"""
Simple Credit Management System - No external dependencies
Works with existing FastAPI and httpx
"""

import os
import json
from datetime import datetime
from typing import Dict, Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

# Supabase config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_KEY")

# Debug logging
print(f"🔧 SUPABASE_URL: {SUPABASE_URL}")
print(f"🔧 SUPABASE_ANON_KEY exists: {bool(SUPABASE_ANON_KEY)}")
print(f"🔧 SUPABASE_SERVICE_KEY exists: {bool(os.getenv('SUPABASE_SERVICE_KEY'))}")

if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ Missing Supabase configuration!")
    print(f"   SUPABASE_URL: {SUPABASE_URL}")
    print(f"   SUPABASE_ANON_KEY: {SUPABASE_ANON_KEY}")

# Credit costs
CREDIT_COSTS = {
    "job_search": 1,
    "cover_letter": 1,
    "cold_email": 1,
    "linkedin_dm": 1,
    "linkedin_connection": 1,
    "resume_analysis": 2,
    "skill_analysis": 1,
    "bulk_application": 5,
    "premium_feature": 3
}

class SimpleCreditManager:
    def __init__(self):
        # Configure httpx client with proper timeouts
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(10.0, connect=5.0),  # 10s total, 5s connect
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10)
        )
    
    async def _supabase_request(self, method: str, table: str, data: Optional[Dict] = None, filters: Optional[Dict] = None):
        """Make HTTP request to Supabase REST API"""
        url = f"{SUPABASE_URL}/rest/v1/{table}"
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        
        # Add filters
        if filters:
            params = []
            for key, value in filters.items():
                params.append(f"{key}=eq.{value}")
            if params:
                url += "?" + "&".join(params)
        
        try:
            print(f"🔗 Making {method} request to: {url}")
            
            if method == "GET":
                response = await self.client.get(url, headers=headers)
            elif method == "POST":
                response = await self.client.post(url, headers=headers, json=data)
            elif method == "PATCH":
                response = await self.client.patch(url, headers=headers, json=data)
            
            print(f"📡 Response status: {response.status_code}")
            if response.status_code >= 400:
                print(f"❌ Response error: {response.text}")
            
            return response
        except httpx.TimeoutException as e:
            print(f"⏰ Supabase request timeout: {e}")
            return None
        except httpx.ConnectError as e:
            print(f"🔌 Supabase connection error: {e}")
            return None
        except Exception as e:
            print(f"❌ Supabase request failed: {e}")
            return None
    
    async def get_user_credits(self, user_id: str) -> Dict:
        """Get current user credit balance"""
        try:
            print(f"💳 Getting credits for user: {user_id}")
            
            response = await self._supabase_request("GET", "user_credits", filters={"user_id": user_id})
            
            if response and response.status_code == 200:
                data = response.json()
                if data:
                    credits = data[0]['credits']
                    print(f"💰 User has {credits} credits")
                    return {
                        "success": True,
                        "credits": credits,
                        "user_id": user_id
                    }
                else:
                    # Create new user with 100 credits
                    await self._create_user_credits(user_id, 10)
                    return {
                        "success": True,
                        "credits": 10,
                        "user_id": user_id
                    }
            else:
                return {
                    "success": False,
                    "error_message": "Failed to get credits",
                    "credits": 0
                }
                
        except Exception as e:
            print(f"❌ Error getting credits: {e}")
            return {
                "success": False,
                "error_message": f"Failed to get credits: {str(e)}",
                "credits": 0
            }
    
    async def _create_user_credits(self, user_id: str, initial_credits: int = 100):
        """Create initial credit record for new user"""
        try:
            data = {
                'user_id': user_id,
                'credits': initial_credits,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            response = await self._supabase_request("POST", "user_credits", data=data)
            print(f"🆕 Created new user with {initial_credits} credits")
            return response
            
        except Exception as e:
            print(f"❌ Error creating user credits: {e}")
            return None
    
    async def process_credit_usage(self, user_id: str, action_type: str, metadata: Optional[Dict] = None) -> Dict:
        """Process credit usage - main function"""
        try:
            print(f"💳 Processing credit usage: {user_id}, {action_type}")
            
            # Step 1: Get current credits
            credit_info = await self.get_user_credits(user_id)
            if not credit_info["success"]:
                return {
                    "success": False,
                    "error_message": "Failed to get user credits",
                    "credits_before": 0,
                    "credits_after": 0,
                    "credits_used": 0
                }
            
            credits_before = credit_info["credits"]
            credits_required = CREDIT_COSTS.get(action_type, 1)
            
            # Step 2: Check if user has enough credits
            if credits_before < credits_required:
                return {
                    "success": False,
                    "error_message": f"Insufficient credits. Need {credits_required}, have {credits_before}",
                    "credits_before": credits_before,
                    "credits_after": credits_before,
                    "credits_used": 0
                }
            
            # Step 3: Deduct credits
            credits_after = credits_before - credits_required
            
            update_data = {
                'credits': credits_after,
                'updated_at': datetime.now().isoformat()
            }
            
            response = await self._supabase_request("PATCH", "user_credits", data=update_data, filters={"user_id": user_id})
            
            if not response or response.status_code != 200:
                return {
                    "success": False,
                    "error_message": "Failed to update credits",
                    "credits_before": credits_before,
                    "credits_after": credits_before,
                    "credits_used": 0
                }
            
            # Step 4: Log transaction
            await self._log_transaction(user_id, action_type, credits_required, credits_before, credits_after, True, metadata)
            
            print(f"✅ Credits deducted: {credits_required}. New balance: {credits_after}")
            
            return {
                "success": True,
                "credits_before": credits_before,
                "credits_after": credits_after,
                "credits_used": credits_required,
                "action_type": action_type
            }
            
        except Exception as e:
            print(f"❌ Credit processing failed: {e}")
            return {
                "success": False,
                "error_message": f"Credit processing failed: {str(e)}",
                "credits_before": 0,
                "credits_after": 0,
                "credits_used": 0
            }
    
    async def _log_transaction(self, user_id: str, action_type: str, credits_used: int, 
                             credits_before: int, credits_after: int, success: bool, metadata: Optional[Dict] = None):
        """Log credit transaction"""
        try:
            transaction_data = {
                'user_id': user_id,
                'action_type': action_type,
                'credits_used': credits_used,
                'credits_before': credits_before,
                'credits_after': credits_after,
                'success': success,
                'metadata': metadata or {},
                'created_at': datetime.now().isoformat()
            }
            
            await self._supabase_request("POST", "credit_transactions", data=transaction_data)
            print(f"📝 Transaction logged")
            
        except Exception as e:
            print(f"❌ Failed to log transaction: {e}")
    
    async def add_credits(self, user_id: str, credits_to_add: int, reason: str = "manual_addition") -> Dict:
        """Add credits to user account"""
        try:
            # Get current credits
            credit_info = await self.get_user_credits(user_id)
            if not credit_info["success"]:
                return {
                    "success": False,
                    "error_message": "User not found"
                }
            
            current_credits = credit_info["credits"]
            new_credits = current_credits + credits_to_add
            
            
            update_data = {
                'credits': new_credits,
                'updated_at': datetime.now().isoformat()
            }
            
            response = await self._supabase_request("PATCH", "user_credits", data=update_data, filters={"user_id": user_id})
            
            if response and response.status_code == 200:
                # Log transaction
                await self._log_transaction(user_id, "credit_purchase", -credits_to_add, current_credits, new_credits, True, {"reason": reason})
                
                return {
                    "success": True,
                    "credits_added": credits_to_add,
                    "credits_before": current_credits,
                    "credits_after": new_credits
                }
            else:
                return {
                    "success": False,
                    "error_message": "Failed to update credits"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error_message": f"Failed to add credits: {str(e)}"
            }
    
    async def get_credit_history(self, user_id: str, limit: int = 50) -> Dict:
        """Get user's credit transaction history"""
        try:
            # Note: This is a simplified version - Supabase REST API ordering is limited
            response = await self._supabase_request("GET", "credit_transactions", filters={"user_id": user_id})
            
            if response and response.status_code == 200:
                transactions = response.json()
                # Sort by created_at (client-side since we can't do complex queries easily)
                transactions.sort(key=lambda x: x['created_at'], reverse=True)
                transactions = transactions[:limit]
                
                return {
                    "success": True,
                    "transactions": transactions,
                    "total_count": len(transactions)
                }
            else:
                return {
                    "success": False,
                    "error_message": "Failed to get credit history",
                    "transactions": []
                }
                
        except Exception as e:
            return {
                "success": False,
                "error_message": f"Failed to get credit history: {str(e)}",
                "transactions": []
            }

# Global instance
credit_manager = SimpleCreditManager()