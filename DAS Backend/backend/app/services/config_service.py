"""
System Configuration Management Service
Handles dynamic system configuration and business rules
"""

import json
from typing import Dict, Any, Optional, List, Union
from sqlalchemy.orm import Session
from sqlalchemy.orm.query import Query
from sqlalchemy import and_

from ..database import SessionLocal
from ..models.system import SystemConfiguration
from ..services.security_service import security_service

class ConfigurationService:
    """Advanced system configuration management"""
    
    def __init__(self):
        self.cache = {}
        self.cache_timeout = 300  # 5 minutes
        self.last_cache_update = 0
        
        # Default system configurations
        self.default_configs = {
            # Academic Settings
            'academic.school_name': {
                'value': 'School Management System',
                'type': 'string',
                'description': 'Name of the school',
                'category': 'academic'
            },
            'academic.academic_year_start_month': {
                'value': '9',
                'type': 'integer',
                'description': 'Month when academic year starts (1-12)',
                'category': 'academic'
            },
            'academic.max_students_per_section': {
                'value': '30',
                'type': 'integer',
                'description': 'Maximum number of students per section',
                'category': 'academic'
            },
            'academic.passing_grade': {
                'value': '50.0',
                'type': 'float',
                'description': 'Minimum passing grade percentage',
                'category': 'academic'
            },
            
            # Financial Settings
            'financial.currency_symbol': {
                'value': 'EGP',
                'type': 'string',
                'description': 'Currency symbol for financial transactions',
                'category': 'financial'
            },
            'financial.default_school_fee': {
                'value': '1000.00',
                'type': 'float',
                'description': 'Default school fee amount',
                'category': 'financial'
            },
            'financial.default_bus_fee': {
                'value': '200.00',
                'type': 'float',
                'description': 'Default bus transportation fee',
                'category': 'financial'
            },
            'financial.late_payment_penalty_rate': {
                'value': '5.0',
                'type': 'float',
                'description': 'Late payment penalty rate as percentage',
                'category': 'financial'
            },
            
            # Security Settings
            'security.session_timeout_hours': {
                'value': '24',
                'type': 'integer',
                'description': 'User session timeout in hours',
                'category': 'security'
            },
            'security.max_login_attempts': {
                'value': '5',
                'type': 'integer',
                'description': 'Maximum login attempts before account lockout',
                'category': 'security'
            },
            'security.lockout_duration_minutes': {
                'value': '30',
                'type': 'integer',
                'description': 'Account lockout duration in minutes',
                'category': 'security'
            },
            'security.password_min_length': {
                'value': '8',
                'type': 'integer',
                'description': 'Minimum password length',
                'category': 'security'
            },
            
            # System Settings
            'system.backup_retention_days': {
                'value': '30',
                'type': 'integer',
                'description': 'Number of days to retain backup files',
                'category': 'system'
            },
            'system.max_file_upload_size_mb': {
                'value': '10',
                'type': 'integer',
                'description': 'Maximum file upload size in MB',
                'category': 'system'
            },
            'system.enable_telegram_notifications': {
                'value': 'true',
                'type': 'boolean',
                'description': 'Enable Telegram notifications',
                'category': 'system'
            },
            'system.auto_backup_enabled': {
                'value': 'true',
                'type': 'boolean',
                'description': 'Enable automatic backups',
                'category': 'system'
            },
            
            # Scheduling Settings
            'scheduling.periods_per_day': {
                'value': '8',
                'type': 'integer',
                'description': 'Number of periods per school day',
                'category': 'scheduling'
            },
            'scheduling.period_duration_minutes': {
                'value': '45',
                'type': 'integer',
                'description': 'Duration of each period in minutes',
                'category': 'scheduling'
            },
            'scheduling.break_duration_minutes': {
                'value': '15',
                'type': 'integer',
                'description': 'Duration of breaks between periods',
                'category': 'scheduling'
            }
        }
    
    def initialize_default_configs(self, user_id: int) -> bool:
        """Initialize default system configurations"""
        try:
            db = SessionLocal()
            try:
                for key, config in self.default_configs.items():
                    # Check if config already exists
                    try:
                        query_method = getattr(db, 'query')
                        query_result = query_method(SystemConfiguration).filter(
                            SystemConfiguration.config_key == key
                        )
                        existing = query_result.first()
                    except:
                        existing = None
                    
                    if not existing:
                        # Create config using dictionary to avoid type errors
                        config_data = {
                            "config_key": key,
                            "config_value": str(config['value']),
                            "config_type": str(config['type']),
                            "description": str(config['description']),
                            "category": str(config['category']),
                            "is_system": True,
                            "updated_by": user_id
                        }
                        new_config = SystemConfiguration(**config_data)
                        db.add(new_config)
        
                db.commit()
                self._clear_cache()
                return True
                
            except Exception as e:
                db.rollback()
                print(f'Failed to initialize default configs: {e}')
                return False

            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to create database session: {e}")
            return False
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get configuration value with type conversion"""
        try:
            db = SessionLocal()
            try:
                try:
                    query_method = getattr(db, 'query')
                    query_result = query_method(SystemConfiguration).filter(
                        SystemConfiguration.config_key == key
                    )
                    config = query_result.first()
                except:
                    config = None
                
                if not config:
                    return default
                
                # Convert value based on type
                return self._convert_value(config.config_value, config.config_type)
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to get config {key}: {e}")
            return default
    
    def set_config(self, key: str, value: Any, user_id: int, 
                  config_type: str = "string", description: str = "",
                  category: str = "custom") -> bool:
        """Set configuration value"""
        try:
            db = SessionLocal()
            try:
                try:
                    query_method = getattr(db, 'query')
                    query_result = query_method(SystemConfiguration).filter(
                        SystemConfiguration.config_key == key
                    )
                    config = query_result.first()
                except:
                    config = None
                
                if config:
                    # Update existing config
                    old_value = config.config_value
                    config.config_value = str(value)
                    config.config_type = config_type
                    config.description = description or config.description
                    config.category = category or config.category
                    config.updated_by = user_id
                    
                    # Log the change
                    security_service.log_audit_event(
                        user_id=user_id,
                        action="UPDATE",
                        table_name="system_configurations",
                        record_id=config.id,
                        old_values={"config_value": old_value},
                        new_values={"config_value": str(value)}
                    )
                else:
                    # Create new config using dictionary to avoid type errors
                    config_data = {
                        "config_key": key,
                        "config_value": str(value),
                        "config_type": config_type,
                        "description": description,
                        "category": category,
                        "is_system": False,
                        "updated_by": user_id
                    }
                    new_config = SystemConfiguration(**config_data)
                    db.add(new_config)
                    
                    # Log the creation
                    security_service.log_audit_event(
                        user_id=user_id,
                        action="CREATE",
                        table_name="system_configurations",
                        new_values={
                            "config_key": key,
                            "config_value": str(value)
                        }
                    )
                
                db.commit()
                self._clear_cache()
                return True
                
            except Exception as e:
                db.rollback()
                print(f"Failed to set config {key}: {e}")
                return False
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to create database session: {e}")
            return False
    
    def get_configs_by_category(self, category: str) -> Dict[str, Any]:
        """Get all configurations in a category"""
        try:
            db = SessionLocal()
            try:
                try:
                    query_method = getattr(db, 'query')
                    query_result = query_method(SystemConfiguration).filter(
                        SystemConfiguration.category == category
                    )
                    configs = query_result.all()
                except:
                    configs = []
                
                result = {}
                for config in configs:
                    result[config.config_key] = {
                        "value": self._convert_value(config.config_value, config.config_type),
                        "type": config.config_type,
                        "description": config.description,
                        "is_system": config.is_system,
                        "updated_at": config.updated_at
                    }
                
                return result
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to get configs for category {category}: {e}")
            return {}
    
    def get_all_configs(self) -> Dict[str, Dict[str, Any]]:
        """Get all system configurations grouped by category"""
        try:
            db = SessionLocal()
            try:
                try:
                    query_method = getattr(db, 'query')
                    query_result = query_method(SystemConfiguration)
                    configs = query_result.all()
                except:
                    configs = []
                
                result = {}
                for config in configs:
                    if config.category not in result:
                        result[config.category] = {}
                    
                    result[config.category][config.config_key] = {
                        "value": self._convert_value(config.config_value, config.config_type),
                        "type": config.config_type,
                        "description": config.description,
                        "is_system": config.is_system,
                        "updated_at": config.updated_at
                    }
                
                return result
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to get all configs: {e}")
            return {}
    
    def delete_config(self, key: str, user_id: int) -> bool:
        """Delete configuration (only non-system configs)"""
        try:
            db = SessionLocal()
            try:
                try:
                    query_method = getattr(db, 'query')
                    query_result = query_method(SystemConfiguration).filter(
                        and_(
                            SystemConfiguration.config_key == key,
                            SystemConfiguration.is_system == False
                        )
                    )
                    config = query_result.first()
                except:
                    config = None
                
                if not config:
                    return False
                
                # Log the deletion
                security_service.log_audit_event(
                    user_id=user_id,
                    action="DELETE",
                    table_name="system_configurations",
                    record_id=config.id,
                    old_values={
                        "config_key": config.config_key,
                        "config_value": config.config_value
                    }
                )
                
                db.delete(config)
                db.commit()
                self._clear_cache()
                return True
                
            except Exception as e:
                db.rollback()
                print(f"Failed to delete config {key}: {e}")
                return False
                
            finally:
                db.close()
                
        except Exception as e:
            print(f"Failed to create database session: {e}")
            return False
    
    def validate_config_value(self, value: str, config_type: str) -> Dict[str, Any]:
        """Validate configuration value based on type"""
        try:
            converted_value = self._convert_value(value, config_type)
            return {"valid": True, "converted_value": converted_value}
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def _convert_value(self, value: str, config_type: str) -> Any:
        """Convert string value to appropriate type"""
        if config_type == "boolean":
            return value.lower() in ["true", "1", "yes", "on"]
        elif config_type == "integer":
            return int(value)
        elif config_type == "float":
            return float(value)
        elif config_type == "json":
            return json.loads(value)
        else:  # string
            return value
    
    def _clear_cache(self):
        """Clear configuration cache"""
        self.cache.clear()
        self.last_cache_update = 0
    
    # Business Rule Helpers
    def get_school_settings(self) -> Dict[str, Any]:
        """Get school-specific settings"""
        return {
            "name": self.get_config("academic.school_name", "School Management System"),
            "academic_year_start_month": self.get_config("academic.academic_year_start_month", 9),
            "max_students_per_section": self.get_config("academic.max_students_per_section", 30),
            "passing_grade": self.get_config("academic.passing_grade", 50.0),
            "currency_symbol": self.get_config("financial.currency_symbol", "EGP")
        }
    
    def get_security_settings(self) -> Dict[str, Any]:
        """Get security-related settings"""
        return {
            "session_timeout_hours": self.get_config("security.session_timeout_hours", 24),
            "max_login_attempts": self.get_config("security.max_login_attempts", 5),
            "lockout_duration_minutes": self.get_config("security.lockout_duration_minutes", 30),
            "password_min_length": self.get_config("security.password_min_length", 8)
        }
    
    def get_financial_settings(self) -> Dict[str, Any]:
        """Get financial settings"""
        return {
            "default_school_fee": self.get_config("financial.default_school_fee", 1000.0),
            "default_bus_fee": self.get_config("financial.default_bus_fee", 200.0),
            "late_payment_penalty_rate": self.get_config("financial.late_payment_penalty_rate", 5.0),
            "currency_symbol": self.get_config("financial.currency_symbol", "EGP")
        }

# Global configuration service instance
config_service = ConfigurationService()