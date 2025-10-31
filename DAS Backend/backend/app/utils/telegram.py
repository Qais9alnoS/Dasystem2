import asyncio
import aiohttp
import json
import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class TelegramService:
    """Telegram notification service with full implementation"""
    
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self.base_url = f"https://api.telegram.org/bot{self.bot_token}" if self.bot_token else None
        self.enabled = bool(self.bot_token and self.chat_id and settings.TELEGRAM_BOT_TOKEN != "your-telegram-bot-token")
        
        if not self.enabled:
            logger.warning("Telegram notifications disabled: missing bot token or chat ID")
    
    async def send_message(self, message: str, parse_mode: str = "HTML", 
                          disable_notification: bool = False) -> Dict[str, Any]:
        """Send a message to Telegram"""
        if not self.enabled:
            logger.warning("Telegram not configured, skipping notification")
            return {"success": False, "error": "Telegram not configured"}
        
        try:
            payload = {
                "chat_id": self.chat_id,
                "text": message,
                "parse_mode": parse_mode,
                "disable_notification": disable_notification
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/sendMessage", json=payload) as response:
                    result = await response.json()
                    
                    if response.status == 200 and result.get("ok"):
                        logger.info("Telegram message sent successfully")
                        return {"success": True, "message_id": result.get("result", {}).get("message_id")}
                    else:
                        logger.error(f"Telegram API error: {result}")
                        return {"success": False, "error": result.get("description", "Unknown error")}
        
        except Exception as e:
            logger.error(f"Failed to send Telegram message: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Telegram bot connection"""
        if not self.enabled:
            return {"success": False, "error": "Telegram not configured"}
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/getMe") as response:
                    result = await response.json()
                    
                    if response.status == 200 and result.get("ok"):
                        bot_info = result.get("result", {})
                        return {
                            "success": True,
                            "bot_info": {
                                "username": bot_info.get("username"),
                                "first_name": bot_info.get("first_name"),
                                "can_join_groups": bot_info.get("can_join_groups"),
                                "can_read_all_group_messages": bot_info.get("can_read_all_group_messages")
                            }
                        }
                    else:
                        return {"success": False, "error": result.get("description", "Unknown error")}
        
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global telegram service instance
telegram_service = TelegramService()

async def send_telegram_notification(message: str):
    """Send notification to Telegram"""
    return await telegram_service.send_message(message)

def send_telegram_notification_sync(message: str):
    """Synchronous wrapper for telegram notifications"""
    try:
        return asyncio.run(send_telegram_notification(message))
    except Exception as e:
        logger.error(f"Failed to send Telegram notification: {e}")
        return {"success": False, "error": str(e)}